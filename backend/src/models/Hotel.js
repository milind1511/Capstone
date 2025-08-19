const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
      maxlength: [100, 'Hotel name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Hotel description is required'],
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hotel owner is required'],
    },
    location: {
      address: {
        type: String,
        required: [true, 'Hotel address is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
      },
      zipCode: {
        type: String,
        required: [true, 'Zip code is required'],
      },
      coordinates: {
        latitude: {
          type: Number,
          required: [true, 'Latitude is required'],
        },
        longitude: {
          type: Number,
          required: [true, 'Longitude is required'],
        },
      },
      googlePlaceId: String,
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
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    category: {
      type: String,
      enum: [
        'hotel',
        'resort',
        'apartment',
        'villa',
        'guesthouse',
        'hostel',
        'boutique',
        'luxury',
        'budget',
      ],
      required: [true, 'Hotel category is required'],
    },
    starRating: {
      type: Number,
      min: [1, 'Star rating must be at least 1'],
      max: [5, 'Star rating cannot be more than 5'],
      required: [true, 'Star rating is required'],
    },
    amenities: [
      {
        type: String,
        enum: [
          'wifi',
          'parking',
          'pool',
          'gym',
          'spa',
          'restaurant',
          'bar',
          'room-service',
          'laundry',
          'concierge',
          'business-center',
          'pet-friendly',
          'air-conditioning',
          'heating',
          'elevator',
          'wheelchair-accessible',
          'beach-access',
          'airport-shuttle',
          'family-friendly',
          'non-smoking',
        ],
      },
    ],
    policies: {
      checkIn: {
        from: {
          type: String,
          required: [true, 'Check-in time is required'],
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
        },
        to: {
          type: String,
          required: [true, 'Check-in time is required'],
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
        },
      },
      checkOut: {
        from: {
          type: String,
          required: [true, 'Check-out time is required'],
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
        },
        to: {
          type: String,
          required: [true, 'Check-out time is required'],
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
        },
      },
      cancellation: {
        type: String,
        enum: ['free', 'partial', 'non-refundable'],
        default: 'free',
      },
      cancellationDeadline: {
        type: Number, // Hours before check-in
        default: 24,
      },
      smokingAllowed: {
        type: Boolean,
        default: false,
      },
      petsAllowed: {
        type: Boolean,
        default: false,
      },
      ageRestriction: {
        minimumAge: {
          type: Number,
          default: 18,
        },
      },
    },
    contact: {
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
      },
      email: {
        type: String,
        required: [true, 'Contact email is required'],
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please enter a valid email',
        ],
      },
      website: {
        type: String,
        match: [
          /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
          'Please enter a valid URL',
        ],
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalRooms: {
      type: Number,
      default: 0,
    },
    priceRange: {
      min: {
        type: Number,
        required: [true, 'Minimum price is required'],
      },
      max: {
        type: Number,
        required: [true, 'Maximum price is required'],
      },
    },
    featured: {
      type: Boolean,
      default: false,
    },
    popularityScore: {
      type: Number,
      default: 0,
    },
    lastBookingDate: Date,
    totalBookings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
hotelSchema.index({ 'location.city': 1 });
hotelSchema.index({ 'location.country': 1 });
hotelSchema.index({ 'location.coordinates': '2dsphere' });
hotelSchema.index({ category: 1 });
hotelSchema.index({ starRating: 1 });
hotelSchema.index({ averageRating: -1 });
hotelSchema.index({ status: 1 });
hotelSchema.index({ isActive: 1 });
hotelSchema.index({ featured: -1 });
hotelSchema.index({ popularityScore: -1 });
hotelSchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });

// Compound indexes
hotelSchema.index({ 'location.city': 1, category: 1, starRating: 1 });
hotelSchema.index({ status: 1, isActive: 1, featured: -1 });

// Virtual for calculating occupancy rate
hotelSchema.virtual('occupancyRate').get(function () {
  // This would be calculated based on current bookings vs total rooms
  // Implementation would require aggregation with bookings collection
  return 0;
});

// Virtual for primary image
hotelSchema.virtual('primaryImage').get(function () {
  const primaryImg = this.images.find((img) => img.isPrimary);
  return primaryImg || this.images[0] || null;
});

// Pre-save middleware to update price range when rooms change
hotelSchema.pre('save', function (next) {
  if (this.isModified('priceRange')) {
    // Validate price range
    if (this.priceRange.min > this.priceRange.max) {
      const error = new Error('Minimum price cannot be greater than maximum price');
      return next(error);
    }
  }
  next();
});

// Static method to get hotels within radius
hotelSchema.statics.getHotelsWithinRadius = function (
  latitude,
  longitude,
  radius
) {
  return this.find({
    'location.coordinates': {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radius / 6371], // radius in km
      },
    },
    status: 'approved',
    isActive: true,
  });
};

// Instance method to update popularity score
hotelSchema.methods.updatePopularityScore = function () {
  // Algorithm considering reviews, bookings, rating, etc.
  const reviewWeight = 0.3;
  const bookingWeight = 0.4;
  const ratingWeight = 0.3;
  
  const reviewScore = Math.min(this.totalReviews / 100, 1) * reviewWeight;
  const bookingScore = Math.min(this.totalBookings / 1000, 1) * bookingWeight;
  const ratingScore = (this.averageRating / 5) * ratingWeight;
  
  this.popularityScore = (reviewScore + bookingScore + ratingScore) * 100;
  return this.save();
};

// Ensure virtual fields are serialized
hotelSchema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('Hotel', hotelSchema);
