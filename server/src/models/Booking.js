const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
  showTime: Date,
  seats: [Number],
  totalPrice: Number,
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
