const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all booking routes
router.use(protect);

// @desc    Get all bookings for logged-in user
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('movie')
      .populate('theater');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get booking by ID (user can only access own bookings)
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
      .populate('movie')
      .populate('theater');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a booking
router.post('/', async (req, res) => {
  try {
    const booking = new Booking({ ...req.body, user: req.user._id });
    const newBooking = await booking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Update a booking (optional)
router.put('/:id', async (req, res) => {
  try {
    const updated = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a booking
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Booking.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
