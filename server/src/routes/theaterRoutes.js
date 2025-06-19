const express = require('express');
const router = express.Router();
const Theater = require('../models/Theater');

// @desc    Get all theaters
router.get('/', async (req, res) => {
  try {
    const theaters = await Theater.find();
    res.json(theaters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get theater by ID
router.get('/:id', async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) return res.status(404).json({ message: 'Theater not found' });
    res.json(theater);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a theater
router.post('/', async (req, res) => {
  const theater = new Theater(req.body);
  try {
    const newTheater = await theater.save();
    res.status(201).json(newTheater);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Update a theater
router.put('/:id', async (req, res) => {
  try {
    const updated = await Theater.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a theater
router.delete('/:id', async (req, res) => {
  try {
    await Theater.findByIdAndDelete(req.params.id);
    res.json({ message: 'Theater deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
