const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: String
});

module.exports = mongoose.model('Setting', settingSchema);
