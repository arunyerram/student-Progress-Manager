// server/routes/students.js
const express = require('express');
const { Parser } = require('json2csv');
const Student = require('../models/student');
const {
  fetchContestHistory,
  fetchProblemStats
} = require('../services/codeforces');
const Setting = require('../models/settings');
const router = express.Router();

// 1. CSV Export
router.get('/export', async (req, res) => {
  try {
    const students = await Student.find().select(
      'name email phone codeforcesHandle currentRating maxRating lastSync'
    );
    const fields = [
      { label: 'Name',           value: 'name' },
      { label: 'Email',          value: 'email' },
      { label: 'Phone',          value: 'phone' },
      { label: 'CF Handle',      value: 'codeforcesHandle' },
      { label: 'Current Rating', value: 'currentRating' },
      { label: 'Max Rating',     value: 'maxRating' },
      { label: 'Last Sync',      value: row => row.lastSync ? row.lastSync.toISOString() : '' }
    ];
    const csv = new Parser({ fields }).parse(students);
    res.header('Content-Type', 'text/csv').attachment('students.csv').send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. List & Create Students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    console.error('GET /api/students error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, phone, codeforcesHandle } = req.body;
  if (!name || !email || !phone || !codeforcesHandle) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const exists = await Student.findOne({
      $or: [{ email }, { codeforcesHandle }]
    });
    if (exists) {
      return res.status(409).json({ error: 'Email or handle already in use' });
    }
    const student = new Student({ name, email, phone, codeforcesHandle });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error('POST /api/students error:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// 3. Update student (with immediate CF re-fetch if handle changed)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, codeforcesHandle } = req.body;
    // Find the student record
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Remember the old handle
    const oldHandle = student.codeforcesHandle;

    // Update basic fields
    student.name             = name;
    student.email            = email;
    student.phone            = phone;
    student.codeforcesHandle = codeforcesHandle;

    // Save the basic updates
    await student.save();

    // If CF handle changed, fetch fresh CF data now
    if (oldHandle !== codeforcesHandle) {
      const contests = await fetchContestHistory(codeforcesHandle);
      const problems = await fetchProblemStats(codeforcesHandle);

      student.contestHistory = contests;
      student.problemStats   = problems;
      student.currentRating  = contests.length ? contests.at(-1).ratingAfter : 0;
      student.maxRating      = contests.reduce((m, c) => Math.max(m, c.ratingAfter), 0);
      student.lastSync       = new Date();

      await student.save();
    }

    res.json(student);
  } catch (err) {
    console.error('PUT /api/students/:id error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// 4. Delete student
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Student not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Most difficult problem solved
router.get('/:id/most-difficult-problem', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const student = await Student.findById(req.params.id).select('problemStats');
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const recent = student.problemStats.filter(p => new Date(p.solvedAt) >= cutoff);
    if (!recent.length) return res.json(null);
    const hardest = recent.reduce((a, b) => (a.rating > b.rating ? a : b));
    res.json(hardest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Sync Codeforces data on-demand
router.post('/:id/sync', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let raw = student.codeforcesHandle;
    let handle = raw.includes('/')
      ? raw.trim().split('/').filter(Boolean).pop()
      : raw.trim();

    const contests = await fetchContestHistory(handle);
    const problems = await fetchProblemStats(handle);

    student.contestHistory = contests;
    student.problemStats   = problems;
    student.currentRating  = contests.length ? contests.at(-1).ratingAfter : 0;
    student.maxRating      = contests.reduce((m, c) => Math.max(m, c.ratingAfter), 0);
    student.lastSync       = new Date();

    await student.save();
    res.json(student);
  } catch (err) {
    console.error('SYNC error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// 7. Toggle inactivity reminder
router.patch('/:id/reminder', async (req, res) => {
  try {
    let { enabled } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.reminderEnabled = typeof enabled === 'boolean'
      ? enabled
      : !student.reminderEnabled;

    await student.save();
    res.json({ reminderEnabled: student.reminderEnabled });
  } catch (err) {
    console.error('PATCH /api/students/:id/reminder error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 8. Filtered contest & problem queries
router.get('/:id/contests', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const student = await Student.findById(req.params.id).select('contestHistory');
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const filtered = student.contestHistory.filter(c => new Date(c.date) >= cutoff);
    res.json(filtered);
  } catch (err) {
    console.error('GET /api/students/:id/contests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/problems', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const student = await Student.findById(req.params.id).select('problemStats');
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const filtered = student.problemStats.filter(p => new Date(p.solvedAt) >= cutoff);
    res.json(filtered);
  } catch (err) {
    console.error('GET /api/students/:id/problems error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 9. Fetch student detail
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error('GET /api/students/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 10. Get & update global sync‐cron setting
router.get('/sync-cron', async (req, res) => {
  let setting = await Setting.findOne({ key: 'syncCron' });
  if (!setting) {
    setting = await Setting.create({ key: 'syncCron', value: '0 2 * * *' });
  }
  res.json({ value: setting.value });
});

router.post('/sync-cron', async (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "Missing value" });
  await Setting.findOneAndUpdate({ key: 'syncCron' }, { value }, { upsert: true });
  // TODO: dynamically re-schedule the cron in memory
  res.json({ success: true });
});

// 11. Reset per-student reminder count
router.patch('/:id/reset-reminder', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.reminderSentCount = 0;
    await student.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 12. Update per-student sync-hour
router.patch('/:id/sync-hour', async (req, res) => {
  try {
    const { syncHour } = req.body;
    if (typeof syncHour !== 'number' || syncHour < 0 || syncHour > 23) {
      return res.status(400).json({ error: "Invalid sync hour" });
    }
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    student.syncHour = syncHour;
    await student.save();
    res.json({ syncHour: student.syncHour });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
