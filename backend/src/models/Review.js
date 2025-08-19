const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
    },
    ratings: {
      overall: {
        type: Number,
        required: [true, 'Overall rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
      },
      cleanliness: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
      },
      comfort: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
      },
      location: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
      },
      facilities: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
      },
      staff: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
      },
      valueForMoney: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
      },
    },
    review: {
      title: {
        type: String,
        required: [true, 'Review title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
      },
      comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true,
        maxlength: [2000, 'Comment cannot be more than 2000 characters'],
      },
      pros: [
        {
          type: String,
          maxlength: [200, 'Pro point cannot be more than 200 characters'],
        },
      ],
      cons: [
        {
          type: String,
          maxlength: [200, 'Con point cannot be more than 200 characters'],
        },
      ],
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        alt: String,
        caption: String,
      },
    ],
    guestInfo: {
      travelType: {
        type: String,
        enum: ['business', 'leisure', 'family', 'couple', 'solo', 'group'],
        required: [true, 'Travel type is required'],
      },
      stayDuration: {
        type: String,
        enum: ['1-night', '2-3-nights', '4-7-nights', '1-2-weeks', 'over-2-weeks'],
      },
      roomType: String,
      travelDate: {
        type: Date,
        required: [true, 'Travel date is required'],
      },
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
      verificationMethod: {
        type: String,
        enum: ['booking-confirmation', 'email-verification', 'manual'],
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
    },
    moderation: {
      isModerated: {
        type: Boolean,
        default: false,
      },
      moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      moderatedAt: Date,
      moderationNotes: String,
      flaggedReasons: [
        {
          type: String,
          enum: [
            'inappropriate-content',
            'spam',
            'fake-review',
            'offensive-language',
            'irrelevant',
            'personal-information',
            'competitor-review',
          ],
        },
      ],
    },
    helpfulness: {
      helpful: {
        type: Number,
        default: 0,
      },
      notHelpful: {
        type: Number,
        default: 0,
      },
      totalVotes: {
        type: Number,
        default: 0,
      },
      helpfulnessScore: {
        type: Number,
        default: 0,
      },
    },
    response: {
      hotelResponse: {
        comment: String,
        respondedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        respondedAt: Date,
        isPublic: {
          type: Boolean,
          default: true,
        },
      },
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'ko', 'zh'],
    },
    source: {
      type: String,
      enum: ['website', 'mobile-app', 'email-invitation'],
      default: 'website',
    },
    sentimentAnalysis: {
      score: {
        type: Number,
        min: [-1, 'Sentiment score cannot be less than -1'],
        max: [1, 'Sentiment score cannot be more than 1'],
      },
      sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
      },
      keywords: [String],
      topics: [
        {
          topic: String,
          sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'negative'],
          },
          confidence: Number,
        },
      ],
    },
    metadata: {
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
      },
      ipAddress: String,
      userAgent: String,
      submissionTime: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
reviewSchema.index({ hotel: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ booking: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ 'ratings.overall': -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ 'verification.isVerified': 1 });

// Compound indexes
reviewSchema.index({ hotel: 1, status: 1, 'ratings.overall': -1 });
reviewSchema.index({ hotel: 1, 'verification.isVerified': 1, createdAt: -1 });
reviewSchema.index({ user: 1, hotel: 1 }, { unique: true }); // One review per user per hotel

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function () {
  const ratingsToAverage = [
    this.ratings.cleanliness,
    this.ratings.comfort,
    this.ratings.location,
    this.ratings.facilities,
    this.ratings.staff,
    this.ratings.valueForMoney,
  ].filter((rating) => rating !== undefined && rating !== null);
  
  if (ratingsToAverage.length === 0) return this.ratings.overall;
  
  const sum = ratingsToAverage.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratingsToAverage.length) * 10) / 10;
});

// Virtual for review age in days
reviewSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for helpfulness percentage
reviewSchema.virtual('helpfulnessPercentage').get(function () {
  if (this.helpfulness.totalVotes === 0) return 0;
  return Math.round((this.helpfulness.helpful / this.helpfulness.totalVotes) * 100);
});

// Pre-save middleware
reviewSchema.pre('save', function (next) {
  // Calculate helpfulness score
  if (this.helpfulness.totalVotes > 0) {
    this.helpfulness.helpfulnessScore =
      this.helpfulness.helpful / this.helpfulness.totalVotes;
  }
  
  // Auto-verify reviews from confirmed bookings
  if (!this.verification.isVerified && this.booking) {
    this.verification.isVerified = true;
    this.verification.verifiedAt = new Date();
    this.verification.verificationMethod = 'booking-confirmation';
  }
  
  next();
});

// Instance method to mark as helpful/not helpful
reviewSchema.methods.markHelpfulness = function (isHelpful) {
  if (isHelpful) {
    this.helpfulness.helpful += 1;
  } else {
    this.helpfulness.notHelpful += 1;
  }
  this.helpfulness.totalVotes += 1;
  this.helpfulness.helpfulnessScore =
    this.helpfulness.helpful / this.helpfulness.totalVotes;
  
  return this.save();
};

// Instance method to add hotel response
reviewSchema.methods.addHotelResponse = function (comment, respondedBy) {
  this.response.hotelResponse = {
    comment,
    respondedBy,
    respondedAt: new Date(),
    isPublic: true,
  };
  
  return this.save();
};

// Instance method to flag review
reviewSchema.methods.flagReview = function (reasons, moderatedBy, notes) {
  this.status = 'flagged';
  this.moderation.isModerated = true;
  this.moderation.moderatedBy = moderatedBy;
  this.moderation.moderatedAt = new Date();
  this.moderation.moderationNotes = notes;
  this.moderation.flaggedReasons = reasons;
  
  return this.save();
};

// Static method to get hotel average ratings
reviewSchema.statics.getHotelAverageRatings = function (hotelId) {
  return this.aggregate([
    {
      $match: {
        hotel: mongoose.Types.ObjectId(hotelId),
        status: 'approved',
        'verification.isVerified': true,
      },
    },
    {
      $group: {
        _id: null,
        averageOverall: { $avg: '$ratings.overall' },
        averageCleanliness: { $avg: '$ratings.cleanliness' },
        averageComfort: { $avg: '$ratings.comfort' },
        averageLocation: { $avg: '$ratings.location' },
        averageFacilities: { $avg: '$ratings.facilities' },
        averageStaff: { $avg: '$ratings.staff' },
        averageValueForMoney: { $avg: '$ratings.valueForMoney' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$ratings.overall',
        },
      },
    },
    {
      $addFields: {
        ratingCounts: {
          5: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 5] },
              },
            },
          },
          4: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 4] },
              },
            },
          },
          3: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 3] },
              },
            },
          },
          2: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 2] },
              },
            },
          },
          1: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 1] },
              },
            },
          },
        },
      },
    },
  ]);
};

// Static method to get review statistics
reviewSchema.statics.getReviewStatistics = function (hotelId, dateRange) {
  const matchQuery = {
    hotel: mongoose.Types.ObjectId(hotelId),
    status: 'approved',
  };
  
  if (dateRange) {
    matchQuery.createdAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end),
    };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        reviewCount: { $sum: 1 },
        averageRating: { $avg: '$ratings.overall' },
        sentimentCounts: {
          $push: '$sentimentAnalysis.sentiment',
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

// Static method to find similar reviews
reviewSchema.statics.findSimilarReviews = function (reviewId, limit = 5) {
  return this.findById(reviewId).then((review) => {
    if (!review) return [];
    
    return this.find({
      _id: { $ne: reviewId },
      hotel: review.hotel,
      'ratings.overall': {
        $gte: review.ratings.overall - 1,
        $lte: review.ratings.overall + 1,
      },
      'guestInfo.travelType': review.guestInfo.travelType,
      status: 'approved',
    })
      .limit(limit)
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
  });
};

// Post-save middleware to update hotel ratings
reviewSchema.post('save', async function (doc) {
  if (doc.status === 'approved') {
    const Hotel = mongoose.model('Hotel');
    await Hotel.updateHotelRatings(doc.hotel);
  }
});

// Post-remove middleware to update hotel ratings
reviewSchema.post('remove', async function (doc) {
  const Hotel = mongoose.model('Hotel');
  await Hotel.updateHotelRatings(doc.hotel);
});

// Ensure virtual fields are serialized
reviewSchema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('Review', reviewSchema);
