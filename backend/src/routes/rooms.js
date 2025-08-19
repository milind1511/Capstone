const express = require('express');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
  getRoomPricing,
  blockRoomDates,
  unblockRoomDates,
  roomPhotoUpload,
  getRoomCalendar,
} = require('../controllers/roomController');

const { protect, authorize, optionalAuth } = require('../middleware/auth');
const {
  roomValidation,
  paramValidation,
  searchValidation,
  checkValidation,
} = require('../middleware/validation');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', optionalAuth, getRooms);
router.get('/available', searchValidation.roomAvailability, checkValidation, optionalAuth, checkAvailability);
router.get('/:id', paramValidation.mongoId, checkValidation, optionalAuth, getRoom);

// Protected routes
router.use(protect);

// Owner and Admin routes
router.post('/', authorize('owner', 'admin'), roomValidation.create, checkValidation, createRoom);
router.put('/:id', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), roomValidation.update, checkValidation, updateRoom);
router.delete('/:id', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), deleteRoom);
router.put('/:id/photo', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), roomPhotoUpload);
router.put('/:id/block', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), blockRoomDates);
router.put('/:id/unblock', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), unblockRoomDates);
router.get('/:id/calendar', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), getRoomCalendar);
router.get('/:id/pricing', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), getRoomPricing);

module.exports = router;
