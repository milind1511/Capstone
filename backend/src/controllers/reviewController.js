const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const { AppError } = require('../middleware/error');

// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  query = Review.find(JSON.parse(queryStr))
    .populate({
      path: 'user',
      select: 'name avatar',
    })
    .populate({
      path: 'hotel',
      select: 'name location images',
    });

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Review.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  const reviews = await query;

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
    count: reviews.length,
    pagination,
    data: reviews,
  });
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
const getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate({
      path: 'user',
      select: 'name avatar',
    })
    .populate({
      path: 'hotel',
      select: 'name location images',
    });

  if (!review) {
    return next(new AppError(`Review not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Get reviews for a hotel
// @route   GET /api/v1/reviews/hotel/:hotelId
// @access  Public
const getHotelReviews = asyncHandler(async (req, res, next) => {
  const { hotelId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const sortBy = req.query.sort || '-createdAt';

  // Check if hotel exists
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError(`Hotel not found with id of ${hotelId}`, 404));
  }

  const startIndex = (page - 1) * limit;

  const reviews = await Review.find({ hotel: hotelId })
    .populate({
      path: 'user',
      select: 'name avatar',
    })
    .sort(sortBy)
    .skip(startIndex)
    .limit(limit);

  const total = await Review.countDocuments({ hotel: hotelId });

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
    count: reviews.length,
    pagination,
    total,
    data: reviews,
  });
});

// @desc    Create new review
// @route   POST /api/v1/reviews
// @access  Private
const createReview = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const { hotel, booking } = req.body;

  // Check if hotel exists
  const hotelExists = await Hotel.findById(hotel);
  if (!hotelExists) {
    return next(new AppError(`Hotel not found with id of ${hotel}`, 404));
  }

  // Check if booking exists and belongs to user
  if (booking) {
    const bookingExists = await Booking.findOne({
      _id: booking,
      user: req.user.id,
      status: 'completed',
    });

    if (!bookingExists) {
      return next(new AppError('You can only review hotels you have stayed at', 400));
    }
  }

  // Check if user has already reviewed this hotel
  const existingReview = await Review.findOne({
    hotel,
    user: req.user.id,
  });

  if (existingReview) {
    return next(new AppError('You have already reviewed this hotel', 400));
  }

  const review = await Review.create(req.body);

  await review.populate([
    {
      path: 'user',
      select: 'name avatar',
    },
    {
      path: 'hotel',
      select: 'name location',
    },
  ]);

  res.status(201).json({
    success: true,
    data: review,
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError(`Review not found with id of ${req.params.id}`, 404));
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this review', 401));
  }

  // Remove fields that shouldn't be updated
  const allowedFields = ['title', 'text', 'rating'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  review = await Review.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate([
    {
      path: 'user',
      select: 'name avatar',
    },
    {
      path: 'hotel',
      select: 'name location',
    },
  ]);

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError(`Review not found with id of ${req.params.id}`, 404));
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this review', 401));
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get current user reviews
// @route   GET /api/v1/reviews/user/my-reviews
// @access  Private
const getMyReviews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  const reviews = await Review.find({ user: req.user.id })
    .populate({
      path: 'hotel',
      select: 'name location images',
    })
    .sort('-createdAt')
    .skip(startIndex)
    .limit(limit);

  const total = await Review.countDocuments({ user: req.user.id });

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
    count: reviews.length,
    pagination,
    total,
    data: reviews,
  });
});

// @desc    Like/Unlike a review
// @route   PUT /api/v1/reviews/:id/like
// @access  Private
const likeReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError(`Review not found with id of ${req.params.id}`, 404));
  }

  const userId = req.user.id;
  const isLiked = review.likes.includes(userId);

  if (isLiked) {
    // Unlike the review
    review.likes = review.likes.filter(id => id.toString() !== userId);
  } else {
    // Like the review
    review.likes.push(userId);
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: {
      liked: !isLiked,
      likesCount: review.likes.length,
    },
  });
});

// @desc    Report a review
// @route   PUT /api/v1/reviews/:id/report
// @access  Private
const reportReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError(`Review not found with id of ${req.params.id}`, 404));
  }

  const userId = req.user.id;
  const hasReported = review.reports.some(report => report.user.toString() === userId);

  if (hasReported) {
    return next(new AppError('You have already reported this review', 400));
  }

  review.reports.push({
    user: userId,
    reason: req.body.reason,
    description: req.body.description,
  });

  await review.save();

  res.status(200).json({
    success: true,
    message: 'Review reported successfully',
  });
});

// @desc    Get review statistics for a hotel
// @route   GET /api/v1/reviews/hotel/:hotelId/statistics
// @access  Public
const getReviewStatistics = asyncHandler(async (req, res, next) => {
  const { hotelId } = req.params;

  // Check if hotel exists
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError(`Hotel not found with id of ${hotelId}`, 404));
  }

  const stats = await Review.aggregate([
    {
      $match: { hotel: hotelId }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratings: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        ratingDistribution: {
          5: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 5] }
              }
            }
          },
          4: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 4] }
              }
            }
          },
          3: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 3] }
              }
            }
          },
          2: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 2] }
              }
            }
          },
          1: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 1] }
              }
            }
          }
        }
      }
    }
  ]);

  const statistics = stats[0] || {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };

  res.status(200).json({
    success: true,
    data: statistics,
  });
});

module.exports = {
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
};
