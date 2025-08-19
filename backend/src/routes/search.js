const express = require('express');
const { searchAdvanced } = require('../services/searchService');
const { optionalAuth } = require('../middleware/auth');
const {
  searchValidation,
  checkValidation,
} = require('../middleware/validation');

const router = express.Router();

// Basic search endpoint (using the search service directly)
router.get('/hotels', searchValidation.hotels, checkValidation, optionalAuth, async (req, res, next) => {
  try {
    const results = await searchAdvanced(req.query);
    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// Advanced search with complex filtering
router.post('/advanced', searchValidation.advanced, checkValidation, optionalAuth, async (req, res, next) => {
  try {
    const results = await searchAdvanced(req.body);
    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
