// // server/index.js

require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const cron     = require('node-cron');

const studentRoutes        = require('./routes/students');
const { fetchContestHistory, fetchProblemStats } = require('./services/codeforces');
const { sendReminder }     = require('./services/email');
const Student              = require('./models/student');
const Setting              = require('./models/settings');

const app = express();
app.use(cors());
app.use(express.json());

const { MONGO_URI, PORT } = process.env;

// ─── Connect to MongoDB ─────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ─── Load or Create Cron Schedule Setting ───────────────────────────────────────
let syncJob;  // will hold our scheduled job

async function loadAndScheduleCron() {
  // 1. Fetch saved cron expression (or default to daily 2 AM)
  let setting = await Setting.findOne({ key: 'syncCron' });
  if (!setting) {
    setting = await Setting.create({ key: 'syncCron', value: '0 2 * * *' });
  }
  const expr = setting.value;
  console.log(`⏰ Scheduling CF sync job with cron: "${expr}"`);

  // 2. If an existing job exists, destroy it
  if (syncJob) {
    syncJob.destroy();
    console.log('🛑 Previous sync job stopped.');
  }

  // 3. Schedule new job
  syncJob = cron.schedule(expr, async () => {
    console.log('🔄 Running CF sync & inactivity check…');
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    try {
      const students = await Student.find();
      for (const st of students) {
        try {
          // Fetch CF data
          const contests = await fetchContestHistory(st.codeforcesHandle);
          const problems = await fetchProblemStats(st.codeforcesHandle);

          st.contestHistory = contests;
          st.problemStats   = problems;
          st.currentRating  = contests.length ? contests.at(-1).ratingAfter : 0;
          st.maxRating      = contests.reduce((m, c) => Math.max(m, c.ratingAfter), 0);
          st.lastSync       = new Date();

          // Inactivity detection
          const lastDates = problems.map(p => p.solvedAt).filter(Boolean);
          const lastSolve = lastDates.length
            ? new Date(Math.max(...lastDates.map(d => new Date(d))))
            : null;

          if (st.reminderEnabled && (!lastSolve || lastSolve < sevenDaysAgo)) {
            console.log('📧 About to send reminder to:', st.email, st.name);
            const result = await sendReminder(st);
            if (!result.quotaExceeded) {
              console.log(`🔔 Reminder sent to ${st.email}`);
            }
          }

          await st.save();
        } catch (innerErr) {
          console.error(`❌ Error syncing ${st.codeforcesHandle}:`, innerErr);
        }
      }
    } catch (err) {
      console.error('❌ Error in sync loop:', err);
    }
  });

  console.log('✅ CF sync job scheduled.');
}

// Initialize the cron on startup
loadAndScheduleCron().catch(err => {
  console.error('❌ Failed to schedule cron job on startup:', err);
});

// ─── Mount student routes ───────────────────────────────────────────────────────
app.use('/api/students', studentRoutes);

// ─── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


