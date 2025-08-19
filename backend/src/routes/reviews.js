const express = require('express');
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getHotelReviews,
  getMyReviews,
  likeReview,
  reportReview,
  getReviewStatistics,
} = require('../controllers/reviewController');

const { protect, authorize, optionalAuth } = require('../middleware/auth');
const {
  reviewValidation,
  paramValidation,
  checkValidation,
} = require('../middleware/validation');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', optionalAuth, getReviews);
router.get('/hotel/:hotelId', paramValidation.mongoId, checkValidation, optionalAuth, getHotelReviews);
router.get('/hotel/:hotelId/statistics', paramValidation.mongoId, checkValidation, getReviewStatistics);
router.get('/:id', paramValidation.mongoId, checkValidation, optionalAuth, getReview);

// Protected routes
router.use(protect);

// User routes
router.post('/', reviewValidation.create, checkValidation, createReview);
router.get('/user/my-reviews', getMyReviews);
router.put('/:id', paramValidation.mongoId, checkValidation, reviewValidation.update, checkValidation, updateReview);
router.delete('/:id', paramValidation.mongoId, checkValidation, deleteReview);
router.put('/:id/like', paramValidation.mongoId, checkValidation, likeReview);
router.put('/:id/report', paramValidation.mongoId, checkValidation, reviewValidation.report, checkValidation, reportReview);

module.exports = router;
