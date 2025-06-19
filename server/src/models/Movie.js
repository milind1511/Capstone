const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  genre: [String],
  duration: Number, // duration in minutes
  releaseDate: Date,
  posterUrl: String,
}, {
  timestamps: true
});

module.exports = mongoose.model('Movie', movieSchema);
