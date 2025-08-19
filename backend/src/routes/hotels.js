const express = require('express');
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelsInRadius,
  hotelPhotoUpload,
  getMyHotels,
  getHotelRooms,
  approveHotel,
  getFeaturedHotels,
} = require('../controllers/hotelController');

const { protect, authorize, optionalAuth } = require('../middleware/auth');
const {
  hotelValidation,
  paramValidation,
  searchValidation,
  checkValidation,
} = require('../middleware/validation');

// Include other resource routers
const roomRouter = require('./rooms');

const router = express.Router();

// Re-route into other resource routers
router.use('/:hotelId/rooms', roomRouter);

// Public routes
router.get('/featured', getFeaturedHotels);
router.get('/radius/:zipcode/:distance', getHotelsInRadius);
router.get('/', searchValidation.hotels, checkValidation, optionalAuth, getHotels);
router.get('/:id', paramValidation.mongoId, checkValidation, optionalAuth, getHotel);
router.get('/:id/rooms', paramValidation.mongoId, checkValidation, optionalAuth, getHotelRooms);

// Protected routes
router.use(protect);

// Owner and Admin routes
router.post('/', authorize('owner', 'admin'), hotelValidation.create, checkValidation, createHotel);
router.get('/owner/my-hotels', authorize('owner', 'admin'), getMyHotels);
router.put('/:id', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), hotelValidation.update, checkValidation, updateHotel);
router.delete('/:id', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), deleteHotel);
router.put('/:id/photo', paramValidation.mongoId, checkValidation, authorize('owner', 'admin'), hotelPhotoUpload);

// Admin only routes
router.put('/:id/approve', paramValidation.mongoId, checkValidation, authorize('admin'), approveHotel);

module.exports = router;
