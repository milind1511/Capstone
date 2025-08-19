const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');
const { ErrorResponse } = require('../middleware/error');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sendEmail = require('../utils/sendEmail');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res, next) => {
  let query = {};

  // Filter by user role
  if (req.user.role === 'guest') {
    query.user = req.user.id;
  } else if (req.user.role === 'owner') {
    // Get owner's hotels
    const ownerHotels = await Hotel.find({ owner: req.user.id }).select('_id');
    const hotelIds = ownerHotels.map((hotel) => hotel._id);
    query.hotel = { $in: hotelIds };
  }
  // Admin can see all bookings (no filter)

  // Additional filters
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.hotel) {
    query.hotel = req.query.hotel;
  }

  if (req.query.dateFrom && req.query.dateTo) {
    query.createdAt = {
      $gte: new Date(req.query.dateFrom),
      $lte: new Date(req.query.dateTo),
    };
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  // Execute query
  const bookings = await Booking.find(query)
    .populate('user', 'firstName lastName email phone')
    .populate('hotel', 'name location contact')
    .populate('room', 'name type roomNumber')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await Booking.countDocuments(query);

  // Pagination result
  const pagination = {};
  const endIndex = page * limit;

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: bookings.length,
    total,
    pagination,
    data: bookings,
  });
});

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('hotel', 'name location contact owner')
    .populate('room', 'name type roomNumber images amenities');

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  // Make sure user can access this booking
  if (
    req.user.role === 'guest' &&
    booking.user._id.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to access this booking`, 401)
    );
  }

  if (
    req.user.role === 'owner' &&
    booking.hotel.owner.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to access this booking`, 401)
    );
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res, next) => {
  const {
    hotel: hotelId,
    room: roomId,
    dates,
    guestDetails,
    specialRequests,
    paymentMethod,
  } = req.body;

  // Verify hotel and room exist
  const hotel = await Hotel.findById(hotelId);
  const room = await Room.findById(roomId);

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${hotelId}`, 404));
  }

  if (!room) {
    return next(new ErrorResponse(`Room not found with id of ${roomId}`, 404));
  }

  if (room.hotel.toString() !== hotelId) {
    return next(new ErrorResponse('Room does not belong to the specified hotel', 400));
  }

  // Check if hotel is approved and active
  if (hotel.status !== 'approved' || !hotel.isActive) {
    return next(new ErrorResponse('This hotel is not available for booking', 400));
  }

  // Check if room is available
  const checkIn = new Date(dates.checkIn);
  const checkOut = new Date(dates.checkOut);

  if (!room.isAvailableForDates(checkIn, checkOut)) {
    return next(
      new ErrorResponse('Room is not available for the selected dates', 400)
    );
  }

  // Calculate pricing
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  let roomRate = room.pricing.basePrice;

  // Apply seasonal pricing and discounts
  const seasonalPrice = room.pricing.seasonalPricing.find(
    (season) => checkIn >= season.startDate && checkIn <= season.endDate
  );

  if (seasonalPrice) {
    roomRate = roomRate * seasonalPrice.priceMultiplier;
  }

  if (room.pricing.discountPercentage > 0) {
    roomRate = roomRate * (1 - room.pricing.discountPercentage / 100);
  }

  const basePrice = roomRate * nights;
  const taxes = room.pricing.taxesAndFees * nights;
  const totalAmount = basePrice + taxes;

  // Create booking data
  const bookingData = {
    user: req.user.id,
    hotel: hotelId,
    room: roomId,
    dates: {
      checkIn,
      checkOut,
      nights,
    },
    guestDetails,
    pricing: {
      roomRate,
      currency: room.pricing.currency,
      breakdown: {
        basePrice,
        taxes,
        fees: 0,
        discounts: 0,
      },
      totalAmount,
    },
    payment: {
      method: paymentMethod || 'card',
      status: 'pending',
    },
    specialRequests,
    source: 'website',
  };

  // Create Stripe PaymentIntent for card payments
  let paymentIntent;
  if (paymentMethod === 'card') {
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: room.pricing.currency.toLowerCase(),
        metadata: {
          hotelId,
          roomId,
          userId: req.user.id,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
        },
      });

      bookingData.payment.stripePaymentIntentId = paymentIntent.id;
    } catch (error) {
      return next(new ErrorResponse('Payment processing failed', 400));
    }
  }

  const booking = await Booking.create(bookingData);

  // Block the room dates
  await room.addUnavailableDates(checkIn, checkOut, 'booked');

  // Populate the booking for response
  await booking.populate([
    { path: 'user', select: 'firstName lastName email phone' },
    { path: 'hotel', select: 'name location contact' },
    { path: 'room', select: 'name type roomNumber' },
  ]);

  res.status(201).json({
    success: true,
    data: booking,
    clientSecret: paymentIntent?.client_secret,
    message: 'Booking created successfully',
  });
});

// @desc    Confirm booking payment
// @route   PUT /api/v1/bookings/:id/confirm
// @access  Private
const confirmBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  // Make sure user can confirm this booking
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to confirm this booking`, 401)
    );
  }

  if (booking.status !== 'pending') {
    return next(new ErrorResponse('Only pending bookings can be confirmed', 400));
  }

  // Verify payment with Stripe if applicable
  if (booking.payment.stripePaymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        booking.payment.stripePaymentIntentId
      );

      if (paymentIntent.status !== 'succeeded') {
        return next(new ErrorResponse('Payment has not been completed', 400));
      }

      booking.payment.status = 'completed';
      booking.payment.paidAmount = booking.pricing.totalAmount;
      booking.payment.paidAt = new Date();
    } catch (error) {
      return next(new ErrorResponse('Payment verification failed', 400));
    }
  }

  // Confirm the booking
  await booking.confirm(req.user.id);

  // Send confirmation email
  try {
    await sendEmail({
      email: booking.guestDetails.primaryGuest.email,
      subject: 'Booking Confirmation - BookingApp',
      template: 'bookingConfirmation',
      data: {
        booking,
        confirmationCode: booking.confirmationCode,
      },
    });
  } catch (error) {
    console.error('Confirmation email failed:', error);
  }

  // Populate for response
  await booking.populate([
    { path: 'user', select: 'firstName lastName email phone' },
    { path: 'hotel', select: 'name location contact' },
    { path: 'room', select: 'name type roomNumber' },
  ]);

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Booking confirmed successfully',
  });
});

// @desc    Cancel booking
// @route   PUT /api/v1/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id)
    .populate('hotel', 'owner policies')
    .populate('room');

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  const canCancel =
    booking.user.toString() === req.user.id ||
    booking.hotel.owner.toString() === req.user.id ||
    req.user.role === 'admin';

  if (!canCancel) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to cancel this booking`, 401)
    );
  }

  // Check if booking can be cancelled
  if (!booking.canBeCancelled()) {
    return next(
      new ErrorResponse('This booking cannot be cancelled due to the cancellation policy', 400)
    );
  }

  // Determine refund policy
  let refundPolicy = 'no-refund';
  const hoursUntilCheckIn = (booking.dates.checkIn - new Date()) / (1000 * 60 * 60);

  if (hoursUntilCheckIn >= 48) {
    refundPolicy = 'full-refund';
  } else if (hoursUntilCheckIn >= 24) {
    refundPolicy = 'partial-refund';
  }

  // Cancel the booking
  await booking.cancel(req.user.id, reason, refundPolicy);

  // Process refund if applicable
  if (refundPolicy !== 'no-refund' && booking.payment.stripePaymentIntentId) {
    try {
      const refundAmount = booking.cancellation.refundAmount;
      
      if (refundAmount > 0) {
        await stripe.refunds.create({
          payment_intent: booking.payment.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100),
        });

        booking.payment.refundAmount = refundAmount;
        booking.payment.refundedAt = new Date();
        await booking.save();
      }
    } catch (error) {
      console.error('Refund processing failed:', error);
      // Don't fail the cancellation if refund fails
    }
  }

  // Remove room blocking
  await booking.room.removeUnavailableDates(
    booking.dates.checkIn,
    booking.dates.checkOut
  );

  // Send cancellation email
  try {
    await sendEmail({
      email: booking.guestDetails.primaryGuest.email,
      subject: 'Booking Cancellation - BookingApp',
      template: 'bookingCancellation',
      data: {
        booking,
        refundAmount: booking.cancellation.refundAmount,
      },
    });
  } catch (error) {
    console.error('Cancellation email failed:', error);
  }

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Booking cancelled successfully',
  });
});

// @desc    Check in guest
// @route   PUT /api/v1/bookings/:id/checkin
// @access  Private (Owner, Admin)
const checkInGuest = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate('hotel', 'owner');

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  const canCheckIn =
    booking.hotel.owner.toString() === req.user.id || req.user.role === 'admin';

  if (!canCheckIn) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to check in this guest`, 401)
    );
  }

  if (booking.status !== 'confirmed') {
    return next(new ErrorResponse('Only confirmed bookings can be checked in', 400));
  }

  // Update booking status
  booking.status = 'checked-in';
  booking.checkInOut.actualCheckIn = new Date();
  booking.lastModified.by = req.user.id;
  booking.lastModified.at = new Date();
  booking.lastModified.action = 'checked-in';

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Guest checked in successfully',
  });
});

// @desc    Check out guest
// @route   PUT /api/v1/bookings/:id/checkout
// @access  Private (Owner, Admin)
const checkOutGuest = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate('hotel', 'owner');

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  const canCheckOut =
    booking.hotel.owner.toString() === req.user.id || req.user.role === 'admin';

  if (!canCheckOut) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to check out this guest`, 401)
    );
  }

  if (booking.status !== 'checked-in') {
    return next(new ErrorResponse('Only checked-in guests can be checked out', 400));
  }

  // Update booking status
  booking.status = 'checked-out';
  booking.checkInOut.actualCheckOut = new Date();
  booking.lastModified.by = req.user.id;
  booking.lastModified.at = new Date();
  booking.lastModified.action = 'checked-out';

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Guest checked out successfully',
  });
});

// @desc    Get booking by confirmation code
// @route   GET /api/v1/bookings/confirmation/:code
// @access  Public
const getBookingByConfirmation = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findOne({
    confirmationCode: req.params.code.toUpperCase(),
  })
    .populate('user', 'firstName lastName email phone')
    .populate('hotel', 'name location contact')
    .populate('room', 'name type roomNumber images amenities');

  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with confirmation code ${req.params.code}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// @desc    Get my bookings
// @route   GET /api/v1/bookings/my-bookings
// @access  Private
const getMyBookings = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  let query = { user: req.user.id };

  if (req.query.status) {
    query.status = req.query.status;
  }

  const bookings = await Booking.find(query)
    .populate('hotel', 'name location images')
    .populate('room', 'name type images')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await Booking.countDocuments(query);

  res.status(200).json({
    success: true,
    count: bookings.length,
    total,
    data: bookings,
  });
});

// @desc    Get booking statistics
// @route   GET /api/v1/bookings/statistics
// @access  Private (Owner, Admin)
const getBookingStatistics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, hotelId } = req.query;

  let matchQuery = {};

  // Filter by date range
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Filter by hotel for owners
  if (req.user.role === 'owner') {
    const ownerHotels = await Hotel.find({ owner: req.user.id }).select('_id');
    const hotelIds = ownerHotels.map((hotel) => hotel._id);
    matchQuery.hotel = { $in: hotelIds };
  } else if (hotelId) {
    matchQuery.hotel = hotelId;
  }

  const stats = await Booking.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageBookingValue: { $avg: '$pricing.totalAmount' },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
  };

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
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
};
