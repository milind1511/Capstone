const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const { asyncHandler } = require('../middleware/error');
const { ErrorResponse } = require('../middleware/error');

// @desc    Get all hotels
// @route   GET /api/v1/hotels
// @access  Public
const getHotels = asyncHandler(async (req, res, next) => {
  let query = {};
  let sortQuery = {};

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude from filtering
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach((param) => delete reqQuery[param]);

  // Build base query filters
  if (reqQuery.city) {
    query['location.city'] = new RegExp(reqQuery.city, 'i');
    delete reqQuery.city;
  }

  if (reqQuery.country) {
    query['location.country'] = new RegExp(reqQuery.country, 'i');
    delete reqQuery.country;
  }

  if (reqQuery.category) {
    query.category = reqQuery.category;
    delete reqQuery.category;
  }

  if (reqQuery.starRating) {
    query.starRating = { $gte: parseInt(reqQuery.starRating) };
    delete reqQuery.starRating;
  }

  if (reqQuery.minPrice || reqQuery.maxPrice) {
    query['priceRange.min'] = {};
    if (reqQuery.minPrice) {
      query['priceRange.min']['$gte'] = parseFloat(reqQuery.minPrice);
    }
    if (reqQuery.maxPrice) {
      query['priceRange.max'] = { $lte: parseFloat(reqQuery.maxPrice) };
    }
    delete reqQuery.minPrice;
    delete reqQuery.maxPrice;
  }

  if (reqQuery.amenities) {
    const amenitiesArray = Array.isArray(reqQuery.amenities)
      ? reqQuery.amenities
      : reqQuery.amenities.split(',');
    query.amenities = { $in: amenitiesArray };
    delete reqQuery.amenities;
  }

  // Location-based search (radius)
  if (reqQuery.latitude && reqQuery.longitude && reqQuery.radius) {
    const radius = parseFloat(reqQuery.radius) / 6371; // Convert to radians
    query['location.coordinates'] = {
      $geoWithin: {
        $centerSphere: [
          [parseFloat(reqQuery.longitude), parseFloat(reqQuery.latitude)],
          radius,
        ],
      },
    };
    delete reqQuery.latitude;
    delete reqQuery.longitude;
    delete reqQuery.radius;
  }

  // Text search
  if (reqQuery.search) {
    query.$or = [
      { name: new RegExp(reqQuery.search, 'i') },
      { description: new RegExp(reqQuery.search, 'i') },
      { 'location.city': new RegExp(reqQuery.search, 'i') },
      { 'location.address': new RegExp(reqQuery.search, 'i') },
    ];
    delete reqQuery.search;
  }

  // Always filter for approved and active hotels for public access
  query.status = 'approved';
  query.isActive = true;

  // Create query string for remaining filters
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);
  query = { ...query, ...JSON.parse(queryStr) };

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    sortQuery = sortBy;
  } else {
    // Default sort by popularity and rating
    sortQuery = '-featured -popularityScore -averageRating';
  }

  // Select Fields
  let selectQuery = '';
  if (req.query.select) {
    selectQuery = req.query.select.split(',').join(' ');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Execute query
  const hotels = await Hotel.find(query)
    .populate('owner', 'firstName lastName email')
    .select(selectQuery)
    .sort(sortQuery)
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await Hotel.countDocuments(query);

  // Pagination result
  const pagination = {};

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
    count: hotels.length,
    total,
    pagination,
    data: hotels,
  });
});

// @desc    Get single hotel
// @route   GET /api/v1/hotels/:id
// @access  Public
const getHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id)
    .populate('owner', 'firstName lastName email phone')
    .populate({
      path: 'reviews',
      select: 'ratings review user createdAt',
      populate: {
        path: 'user',
        select: 'firstName lastName avatar',
      },
      match: { status: 'approved' },
      options: {
        sort: { createdAt: -1 },
        limit: 10,
      },
    });

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${req.params.id}`, 404));
  }

  // Check if hotel is approved and active (unless user is owner or admin)
  if (
    hotel.status !== 'approved' ||
    !hotel.isActive
  ) {
    if (
      !req.user ||
      (req.user.role !== 'admin' && hotel.owner._id.toString() !== req.user.id)
    ) {
      return next(new ErrorResponse(`Hotel not found with id of ${req.params.id}`, 404));
    }
  }

  res.status(200).json({
    success: true,
    data: hotel,
  });
});

// @desc    Create new hotel
// @route   POST /api/v1/hotels
// @access  Private (Owner, Admin)
const createHotel = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.owner = req.user.id;

  // Check if user already has a hotel (limit for owners)
  if (req.user.role === 'owner') {
    const existingHotel = await Hotel.findOne({ owner: req.user.id });
    if (existingHotel) {
      return next(
        new ErrorResponse('You can only create one hotel. Contact admin for multiple hotels.', 400)
      );
    }
  }

  const hotel = await Hotel.create(req.body);

  res.status(201).json({
    success: true,
    data: hotel,
    message: 'Hotel created successfully. Pending approval.',
  });
});

// @desc    Update hotel
// @route   PUT /api/v1/hotels/:id
// @access  Private (Owner, Admin)
const updateHotel = asyncHandler(async (req, res, next) => {
  let hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this hotel`, 401)
    );
  }

  // Prevent status changes by non-admin users
  if (req.body.status && req.user.role !== 'admin') {
    delete req.body.status;
  }

  hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: hotel,
    message: 'Hotel updated successfully',
  });
});

// @desc    Delete hotel
// @route   DELETE /api/v1/hotels/:id
// @access  Private (Owner, Admin)
const deleteHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this hotel`, 401)
    );
  }

  // Soft delete by setting isActive to false
  hotel.isActive = false;
  await hotel.save();

  res.status(200).json({
    success: true,
    message: 'Hotel deleted successfully',
  });
});

// @desc    Get hotels within radius
// @route   GET /api/v1/hotels/radius/:zipcode/:distance
// @access  Public
const getHotelsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder (you would implement this)
  // For now, using example coordinates
  const lat = 40.7128; // New York City example
  const lng = -74.0060;

  // Calc radius using radians
  // Divide distance by radius of Earth
  // Earth Radius = 6,371 km / 3,959 mi
  const radius = distance / 6371;

  const hotels = await Hotel.find({
    'location.coordinates': {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
    status: 'approved',
    isActive: true,
  });

  res.status(200).json({
    success: true,
    count: hotels.length,
    data: hotels,
  });
});

// @desc    Upload hotel photos
// @route   PUT /api/v1/hotels/:id/photo
// @access  Private (Owner, Admin)
const hotelPhotoUpload = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is hotel owner or admin
  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this hotel`, 401)
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

// @desc    Get my hotels (for owners)
// @route   GET /api/v1/hotels/my-hotels
// @access  Private (Owner, Admin)
const getMyHotels = asyncHandler(async (req, res, next) => {
  const hotels = await Hotel.find({ owner: req.user.id })
    .populate({
      path: 'rooms',
      select: 'name type capacity pricing status',
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: hotels.length,
    data: hotels,
  });
});

// @desc    Get hotel rooms
// @route   GET /api/v1/hotels/:id/rooms
// @access  Public
const getHotelRooms = asyncHandler(async (req, res, next) => {
  // Check if hotel exists and is accessible
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${req.params.id}`, 404));
  }

  if (hotel.status !== 'approved' || !hotel.isActive) {
    if (
      !req.user ||
      (req.user.role !== 'admin' && hotel.owner.toString() !== req.user.id)
    ) {
      return next(new ErrorResponse(`Hotel not found with id of ${req.params.id}`, 404));
    }
  }

  // Get query parameters for room filtering
  const {
    checkIn,
    checkOut,
    adults = 1,
    children = 0,
    type,
    minPrice,
    maxPrice,
  } = req.query;

  let query = { hotel: req.params.id, status: 'active' };

  // Filter by room type
  if (type) {
    query.type = type;
  }

  // Filter by capacity
  query['capacity.adults'] = { $gte: parseInt(adults) };
  query['capacity.children'] = { $gte: parseInt(children) };

  // Filter by price range
  if (minPrice || maxPrice) {
    query['pricing.basePrice'] = {};
    if (minPrice) {
      query['pricing.basePrice']['$gte'] = parseFloat(minPrice);
    }
    if (maxPrice) {
      query['pricing.basePrice']['$lte'] = parseFloat(maxPrice);
    }
  }

  let rooms;

  // If dates provided, check availability
  if (checkIn && checkOut) {
    rooms = await Room.findAvailableRooms(
      req.params.id,
      new Date(checkIn),
      new Date(checkOut),
      parseInt(adults),
      parseInt(children)
    );
  } else {
    rooms = await Room.find(query).populate('hotel', 'name location contact');
  }

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// @desc    Approve/Reject hotel (Admin only)
// @route   PUT /api/v1/hotels/:id/approve
// @access  Private (Admin)
const approveHotel = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Status must be approved or rejected', 400));
  }

  const hotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    {
      status,
      approvalNote: note,
      approvedBy: req.user.id,
      approvedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!hotel) {
    return next(new ErrorResponse(`Hotel not found with id of ${req.params.id}`, 404));
  }

  // Send notification email to owner
  // Implementation would go here

  res.status(200).json({
    success: true,
    data: hotel,
    message: `Hotel ${status} successfully`,
  });
});

// @desc    Get featured hotels
// @route   GET /api/v1/hotels/featured
// @access  Public
const getFeaturedHotels = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 6;

  const hotels = await Hotel.find({
    featured: true,
    status: 'approved',
    isActive: true,
  })
    .select('name images location starRating averageRating totalReviews priceRange')
    .limit(limit)
    .sort('-popularityScore');

  res.status(200).json({
    success: true,
    count: hotels.length,
    data: hotels,
  });
});

module.exports = {
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
};
