const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: String,
  address: String,
  screens: Number,
}, {
  timestamps: true
});

module.exports = mongoose.model('Theater', theaterSchema);
