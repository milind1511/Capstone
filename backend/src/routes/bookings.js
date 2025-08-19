const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  confirmBooking,
  cancelBooking,
  checkInGuest,
  checkOutGuest,
  getBookingByConfirmation,
  getMyBookings,
  getBookingStatistics,
} = require('../controllers/bookingController');

const { protect, authorize } = require('../middleware/auth');
const {
  bookingValidation,
  paramValidation,
  checkValidation,
} = require('../middleware/validation');

const router = express.Router();

// Protected routes
router.use(protect);

// Guest routes
router.get('/my-bookings', getMyBookings);
router.post('/', bookingValidation.create, checkValidation, createBooking);
router.get('/:id', paramValidation.mongoId, checkValidation, getBooking);
router.put('/:id/cancel', paramValidation.mongoId, checkValidation, cancelBooking);

// Owner routes
router.put('/:id/confirm', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), confirmBooking);
router.put('/:id/checkin', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), checkInGuest);
router.put('/:id/checkout', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), checkOutGuest);

// Admin routes
router.get('/', authorize('admin'), getBookings);

module.exports = router;
