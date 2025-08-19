const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel reference is required'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [100, 'Room name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Room description is required'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    type: {
      type: String,
      enum: [
        'single',
        'double',
        'twin',
        'triple',
        'quad',
        'king',
        'queen',
        'suite',
        'deluxe',
        'presidential',
        'family',
        'connecting',
      ],
      required: [true, 'Room type is required'],
    },
    capacity: {
      adults: {
        type: Number,
        required: [true, 'Adult capacity is required'],
        min: [1, 'Adult capacity must be at least 1'],
        max: [10, 'Adult capacity cannot exceed 10'],
      },
      children: {
        type: Number,
        default: 0,
        min: [0, 'Children capacity cannot be negative'],
        max: [6, 'Children capacity cannot exceed 6'],
      },
      infants: {
        type: Number,
        default: 0,
        min: [0, 'Infants capacity cannot be negative'],
        max: [4, 'Infants capacity cannot exceed 4'],
      },
    },
    bedConfiguration: [
      {
        type: {
          type: String,
          enum: ['single', 'double', 'queen', 'king', 'sofa-bed', 'bunk-bed'],
          required: true,
        },
        count: {
          type: Number,
          required: true,
          min: [1, 'Bed count must be at least 1'],
        },
      },
    ],
    size: {
      area: {
        type: Number, // in square meters
        required: [true, 'Room area is required'],
        min: [10, 'Room area must be at least 10 sqm'],
      },
      unit: {
        type: String,
        enum: ['sqm', 'sqft'],
        default: 'sqm',
      },
    },
    floor: {
      type: Number,
      min: [0, 'Floor cannot be negative'],
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
    amenities: [
      {
        type: String,
        enum: [
          'wifi',
          'air-conditioning',
          'heating',
          'tv',
          'cable-tv',
          'satellite-tv',
          'netflix',
          'minibar',
          'safe',
          'balcony',
          'terrace',
          'city-view',
          'sea-view',
          'mountain-view',
          'garden-view',
          'pool-view',
          'private-bathroom',
          'bathtub',
          'shower',
          'hairdryer',
          'toiletries',
          'towels',
          'desk',
          'chair',
          'wardrobe',
          'iron',
          'ironing-board',
          'coffee-maker',
          'tea-maker',
          'refrigerator',
          'microwave',
          'kitchenette',
          'dishwasher',
          'washing-machine',
          'room-service',
          'daily-housekeeping',
          'turndown-service',
          'soundproof',
          'non-smoking',
          'smoking-allowed',
          'pet-friendly',
          'wheelchair-accessible',
        ],
      },
    ],
    pricing: {
      basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Price cannot be negative'],
      },
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'],
      },
      taxesAndFees: {
        type: Number,
        default: 0,
        min: [0, 'Taxes and fees cannot be negative'],
      },
      discountPercentage: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%'],
      },
      seasonalPricing: [
        {
          name: {
            type: String,
            required: true,
          },
          startDate: {
            type: Date,
            required: true,
          },
          endDate: {
            type: Date,
            required: true,
          },
          priceMultiplier: {
            type: Number,
            required: true,
            min: [0.1, 'Price multiplier must be at least 0.1'],
            max: [10, 'Price multiplier cannot exceed 10'],
          },
        },
      ],
    },
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      unavailableDates: [
        {
          startDate: {
            type: Date,
            required: true,
          },
          endDate: {
            type: Date,
            required: true,
          },
          reason: {
            type: String,
            enum: ['maintenance', 'booked', 'blocked', 'renovation'],
            default: 'blocked',
          },
        },
      ],
      minimumStay: {
        type: Number,
        default: 1,
        min: [1, 'Minimum stay must be at least 1 night'],
      },
      maximumStay: {
        type: Number,
        default: 365,
        min: [1, 'Maximum stay must be at least 1 night'],
      },
      advanceBookingDays: {
        type: Number,
        default: 365,
        min: [0, 'Advance booking days cannot be negative'],
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'out-of-order'],
      default: 'active',
    },
    lastCleaned: {
      type: Date,
      default: Date.now,
    },
    maintenanceNotes: [
      {
        note: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'urgent'],
          default: 'medium',
        },
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],
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
    totalBookings: {
      type: Number,
      default: 0,
    },
    lastBookingDate: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hotel: 1, type: 1 });
roomSchema.index({ hotel: 1, status: 1 });
roomSchema.index({ hotel: 1, 'availability.isAvailable': 1 });
roomSchema.index({ hotel: 1, 'pricing.basePrice': 1 });
roomSchema.index({ 'capacity.adults': 1, 'capacity.children': 1 });

// Virtual for total capacity
roomSchema.virtual('totalCapacity').get(function () {
  return this.capacity.adults + this.capacity.children + this.capacity.infants;
});

// Virtual for current price (considering discounts and seasonal pricing)
roomSchema.virtual('currentPrice').get(function () {
  let price = this.pricing.basePrice;
  
  // Apply discount
  if (this.pricing.discountPercentage > 0) {
    price = price * (1 - this.pricing.discountPercentage / 100);
  }
  
  // Check for seasonal pricing
  const now = new Date();
  const seasonalPrice = this.pricing.seasonalPricing.find(
    (season) => now >= season.startDate && now <= season.endDate
  );
  
  if (seasonalPrice) {
    price = price * seasonalPrice.priceMultiplier;
  }
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
});

// Virtual for primary image
roomSchema.virtual('primaryImage').get(function () {
  const primaryImg = this.images.find((img) => img.isPrimary);
  return primaryImg || this.images[0] || null;
});

// Instance method to check availability for date range
roomSchema.methods.isAvailableForDates = function (checkIn, checkOut) {
  if (!this.availability.isAvailable || this.status !== 'active') {
    return false;
  }
  
  // Check if dates conflict with unavailable periods
  const conflicts = this.availability.unavailableDates.some((period) => {
    return (
      (checkIn >= period.startDate && checkIn < period.endDate) ||
      (checkOut > period.startDate && checkOut <= period.endDate) ||
      (checkIn <= period.startDate && checkOut >= period.endDate)
    );
  });
  
  return !conflicts;
};

// Instance method to add unavailable dates
roomSchema.methods.addUnavailableDates = function (startDate, endDate, reason = 'blocked') {
  this.availability.unavailableDates.push({
    startDate,
    endDate,
    reason,
  });
  return this.save();
};

// Instance method to remove unavailable dates
roomSchema.methods.removeUnavailableDates = function (startDate, endDate) {
  this.availability.unavailableDates = this.availability.unavailableDates.filter(
    (period) =>
      !(period.startDate.getTime() === startDate.getTime() &&
        period.endDate.getTime() === endDate.getTime())
  );
  return this.save();
};

// Static method to find available rooms for hotel and date range
roomSchema.statics.findAvailableRooms = function (
  hotelId,
  checkIn,
  checkOut,
  adults = 1,
  children = 0
) {
  return this.find({
    hotel: hotelId,
    status: 'active',
    'availability.isAvailable': true,
    'capacity.adults': { $gte: adults },
    'capacity.children': { $gte: children },
    'availability.unavailableDates': {
      $not: {
        $elemMatch: {
          $or: [
            {
              startDate: { $lte: checkIn },
              endDate: { $gt: checkIn },
            },
            {
              startDate: { $lt: checkOut },
              endDate: { $gte: checkOut },
            },
            {
              startDate: { $gte: checkIn },
              endDate: { $lte: checkOut },
            },
          ],
        },
      },
    },
  }).populate('hotel', 'name location contact');
};

// Pre-save validation
roomSchema.pre('save', function (next) {
  // Ensure at least one primary image
  if (this.images.length > 0) {
    const primaryImages = this.images.filter((img) => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      // Ensure only one primary image
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }
  
  next();
});

// Ensure virtual fields are serialized
roomSchema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('Room', roomSchema);
