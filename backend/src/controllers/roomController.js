const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/error');
const { ErrorResponse } = require('../middleware/error');

// @desc    Get all rooms for a hotel
// @route   GET /api/v1/hotels/:hotelId/rooms
// @access  Public
const getRooms = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.hotelId);

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${req.params.hotelId}`, 404));
  }

  // Check if hotel is accessible
  if (hotel.status !== 'approved' || !hotel.isActive) {
    if (
      !req.user ||
      (req.user.role !== 'admin' && hotel.owner.toString() !== req.user.id)
    ) {
      return next(new ErrorResponse(`Hotel not found with id of ${req.params.hotelId}`, 404));
    }
  }

  const rooms = await Room.find({ hotel: req.params.hotelId })
    .populate('hotel', 'name location contact')
    .sort({ roomNumber: 1 });

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// @desc    Get single room
// @route   GET /api/v1/rooms/:id
// @access  Public
const getRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate('hotel');

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  // Check if hotel is accessible
  if (room.hotel.status !== 'approved' || !room.hotel.isActive) {
    if (
      !req.user ||
      (req.user.role !== 'admin' && room.hotel.owner.toString() !== req.user.id)
    ) {
      return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
    }
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Create new room
// @route   POST /api/v1/hotels/:hotelId/rooms
// @access  Private (Owner, Admin)
const createRoom = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.hotelId);

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${req.params.hotelId}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to add rooms to this hotel`, 401)
    );
  }

  // Add hotel ID to request body
  req.body.hotel = req.params.hotelId;

  // Check if room number already exists in this hotel
  const existingRoom = await Room.findOne({
    hotel: req.params.hotelId,
    roomNumber: req.body.roomNumber,
  });

  if (existingRoom) {
    return next(
      new ErrorResponse(`Room number ${req.body.roomNumber} already exists in this hotel`, 400)
    );
  }

  const room = await Room.create(req.body);

  // Update hotel's total rooms count
  await Hotel.findByIdAndUpdate(req.params.hotelId, {
    $inc: { totalRooms: 1 },
  });

  res.status(201).json({
    success: true,
    data: room,
    message: 'Room created successfully',
  });
});

// @desc    Update room
// @route   PUT /api/v1/rooms/:id
// @access  Private (Owner, Admin)
const updateRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id).populate('hotel');

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (room.hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this room`, 401)
    );
  }

  // Check if room number is being changed and if it conflicts
  if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
    const existingRoom = await Room.findOne({
      hotel: room.hotel._id,
      roomNumber: req.body.roomNumber,
      _id: { $ne: req.params.id },
    });

    if (existingRoom) {
      return next(
        new ErrorResponse(`Room number ${req.body.roomNumber} already exists in this hotel`, 400)
      );
    }
  }

  room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: room,
    message: 'Room updated successfully',
  });
});

// @desc    Delete room
// @route   DELETE /api/v1/rooms/:id
// @access  Private (Owner, Admin)
const deleteRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate('hotel');

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (room.hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this room`, 401)
    );
  }

  // Check for active bookings
  const activeBookings = await Booking.find({
    room: req.params.id,
    status: { $in: ['pending', 'confirmed', 'checked-in'] },
  });

  if (activeBookings.length > 0) {
    return next(
      new ErrorResponse('Cannot delete room with active bookings', 400)
    );
  }

  // Soft delete by setting status to inactive
  room.status = 'inactive';
  await room.save();

  // Update hotel's total rooms count
  await Hotel.findByIdAndUpdate(room.hotel._id, {
    $inc: { totalRooms: -1 },
  });

  res.status(200).json({
    success: true,
    message: 'Room deleted successfully',
  });
});

// @desc    Check room availability
// @route   POST /api/v1/rooms/:id/availability
// @access  Public
const checkAvailability = asyncHandler(async (req, res, next) => {
  const { checkIn, checkOut } = req.body;

  if (!checkIn || !checkOut) {
    return next(new ErrorResponse('Check-in and check-out dates are required', 400));
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkInDate >= checkOutDate) {
    return next(new ErrorResponse('Check-out date must be after check-in date', 400));
  }

  if (checkInDate < new Date()) {
    return next(new ErrorResponse('Check-in date cannot be in the past', 400));
  }

  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  const isAvailable = room.isAvailableForDates(checkInDate, checkOutDate);

  // Get conflicting bookings for details
  const conflictingBookings = await Booking.find({
    room: req.params.id,
    status: { $in: ['confirmed', 'checked-in'] },
    $or: [
      {
        'dates.checkIn': { $lte: checkInDate },
        'dates.checkOut': { $gt: checkInDate },
      },
      {
        'dates.checkIn': { $lt: checkOutDate },
        'dates.checkOut': { $gte: checkOutDate },
      },
      {
        'dates.checkIn': { $gte: checkInDate },
        'dates.checkOut': { $lte: checkOutDate },
      },
    ],
  });

  res.status(200).json({
    success: true,
    data: {
      isAvailable,
      room: {
        id: room._id,
        name: room.name,
        type: room.type,
        currentPrice: room.currentPrice,
      },
      conflictingBookings: conflictingBookings.map((booking) => ({
        checkIn: booking.dates.checkIn,
        checkOut: booking.dates.checkOut,
        bookingId: booking.bookingId,
      })),
    },
  });
});

// @desc    Get room pricing for date range
// @route   POST /api/v1/rooms/:id/pricing
// @access  Public
const getRoomPricing = asyncHandler(async (req, res, next) => {
  const { checkIn, checkOut } = req.body;

  if (!checkIn || !checkOut) {
    return next(new ErrorResponse('Check-in and check-out dates are required', 400));
  }

  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  let totalPrice = 0;
  const nightlyRates = [];

  // Calculate price for each night
  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(checkInDate);
    currentDate.setDate(currentDate.getDate() + i);

    let nightlyRate = room.pricing.basePrice;

    // Check for seasonal pricing
    const seasonalPrice = room.pricing.seasonalPricing.find(
      (season) => currentDate >= season.startDate && currentDate <= season.endDate
    );

    if (seasonalPrice) {
      nightlyRate = nightlyRate * seasonalPrice.priceMultiplier;
    }

    // Apply discount
    if (room.pricing.discountPercentage > 0) {
      nightlyRate = nightlyRate * (1 - room.pricing.discountPercentage / 100);
    }

    nightlyRate = Math.round(nightlyRate * 100) / 100;
    totalPrice += nightlyRate;

    nightlyRates.push({
      date: currentDate.toISOString().split('T')[0],
      rate: nightlyRate,
    });
  }

  const taxesAndFees = room.pricing.taxesAndFees * nights;
  const grandTotal = totalPrice + taxesAndFees;

  res.status(200).json({
    success: true,
    data: {
      room: {
        id: room._id,
        name: room.name,
        type: room.type,
      },
      period: {
        checkIn,
        checkOut,
        nights,
      },
      pricing: {
        nightlyRates,
        subtotal: totalPrice,
        taxesAndFees,
        total: grandTotal,
        currency: room.pricing.currency,
        averagePerNight: Math.round((totalPrice / nights) * 100) / 100,
      },
    },
  });
});

// @desc    Block room dates
// @route   POST /api/v1/rooms/:id/block
// @access  Private (Owner, Admin)
const blockRoomDates = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, reason } = req.body;

  const room = await Room.findById(req.params.id).populate('hotel');

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (room.hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to block this room`, 401)
    );
  }

  await room.addUnavailableDates(new Date(startDate), new Date(endDate), reason);

  res.status(200).json({
    success: true,
    message: 'Room dates blocked successfully',
    data: room,
  });
});

// @desc    Unblock room dates
// @route   DELETE /api/v1/rooms/:id/block
// @access  Private (Owner, Admin)
const unblockRoomDates = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.body;

  const room = await Room.findById(req.params.id).populate('hotel');

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (room.hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to unblock this room`, 401)
    );
  }

  await room.removeUnavailableDates(new Date(startDate), new Date(endDate));

  res.status(200).json({
    success: true,
    message: 'Room dates unblocked successfully',
    data: room,
  });
});

// @desc    Upload room photos
// @route   PUT /api/v1/rooms/:id/photo
// @access  Private (Owner, Admin)
const roomPhotoUpload = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate('hotel');

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (room.hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this room`, 401)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  // This would integrate with Cloudinary
  // For now, just return success
  res.status(200).json({
    success: true,
    message: 'Photo uploaded successfully',
  });
});

// @desc    Get room availability calendar
// @route   GET /api/v1/rooms/:id/calendar
// @access  Public
const getRoomCalendar = asyncHandler(async (req, res, next) => {
  const { year, month } = req.query;
  
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${req.params.id}`, 404));
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Get bookings for the month
  const bookings = await Booking.find({
    room: req.params.id,
    status: { $in: ['confirmed', 'checked-in', 'checked-out'] },
    $or: [
      {
        'dates.checkIn': { $lte: endDate },
        'dates.checkOut': { $gte: startDate },
      },
    ],
  });

  // Generate calendar data
  const calendar = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if date is booked
    const isBooked = bookings.some((booking) =>
      currentDate >= booking.dates.checkIn && currentDate < booking.dates.checkOut
    );

    // Check if date is blocked
    const isBlocked = room.availability.unavailableDates.some((period) =>
      currentDate >= period.startDate && currentDate <= period.endDate
    );

    // Get pricing for the date
    let price = room.pricing.basePrice;
    const seasonalPrice = room.pricing.seasonalPricing.find(
      (season) => currentDate >= season.startDate && currentDate <= season.endDate
    );

    if (seasonalPrice) {
      price = price * seasonalPrice.priceMultiplier;
    }

    if (room.pricing.discountPercentage > 0) {
      price = price * (1 - room.pricing.discountPercentage / 100);
    }

    calendar.push({
      date: dateStr,
      available: !isBooked && !isBlocked && room.status === 'active',
      price: Math.round(price * 100) / 100,
      status: isBooked ? 'booked' : isBlocked ? 'blocked' : 'available',
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  res.status(200).json({
    success: true,
    data: {
      room: {
        id: room._id,
        name: room.name,
        type: room.type,
      },
      period: {
        year: parseInt(year),
        month: parseInt(month),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      calendar,
    },
  });
});

module.exports = {
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
};
