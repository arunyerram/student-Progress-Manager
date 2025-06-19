const mongoose = require('mongoose');
const { Schema } = mongoose;

// Embedded schemas
const ContestHistorySchema = new Schema({
  contestId: Number,
  name: String,
  date: Date,
  rank: Number,
  ratingBefore: Number,
  ratingAfter: Number,
  problemsUnsolved: Number
}, { _id: false });

const ProblemStatsSchema = new Schema({
  problemId:  { type: String, required: true },
  solvedAt:   Date,
  rating:     Number
}, { _id: false });

const StudentSchema = new Schema({
  name:               { type: String, required: true },
  email:              { type: String, required: true, unique: true },
  phone:              { type: String, required: true },
  codeforcesHandle:   { type: String, required: true, unique: true },
  currentRating:      { type: Number, default: 0 },
  maxRating:          { type: Number, default: 0 },
  lastSync:           { type: Date },
  syncHour:           { type: Number, default: 2 },      // cron hour
  reminderEnabled:    { type: Boolean, default: true },
  reminderSentCount:  { type: Number, default: 0 },      // <--- NEW FIELD
  contestHistory:     [ContestHistorySchema],
  problemStats:       [ProblemStatsSchema]
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
