const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
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
      required: [true, 'Room is required'],
    },
    guestDetails: {
      primaryGuest: {
        firstName: {
          type: String,
          required: [true, 'Primary guest first name is required'],
        },
        lastName: {
          type: String,
          required: [true, 'Primary guest last name is required'],
        },
        email: {
          type: String,
          required: [true, 'Primary guest email is required'],
          match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email',
          ],
        },
        phone: {
          type: String,
          required: [true, 'Primary guest phone is required'],
        },
      },
      additionalGuests: [
        {
          firstName: String,
          lastName: String,
          age: Number,
          relationship: {
            type: String,
            enum: ['spouse', 'child', 'parent', 'sibling', 'friend', 'other'],
          },
        },
      ],
      totalGuests: {
        adults: {
          type: Number,
          required: [true, 'Number of adults is required'],
          min: [1, 'At least one adult is required'],
        },
        children: {
          type: Number,
          default: 0,
          min: [0, 'Children count cannot be negative'],
        },
        infants: {
          type: Number,
          default: 0,
          min: [0, 'Infants count cannot be negative'],
        },
      },
    },
    dates: {
      checkIn: {
        type: Date,
        required: [true, 'Check-in date is required'],
      },
      checkOut: {
        type: Date,
        required: [true, 'Check-out date is required'],
      },
      nights: {
        type: Number,
        required: true,
      },
    },
    pricing: {
      roomRate: {
        type: Number,
        required: [true, 'Room rate is required'],
        min: [0, 'Room rate cannot be negative'],
      },
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'],
      },
      breakdown: {
        basePrice: {
          type: Number,
          required: true,
        },
        taxes: {
          type: Number,
          default: 0,
        },
        fees: {
          type: Number,
          default: 0,
        },
        discounts: {
          type: Number,
          default: 0,
        },
        extras: [
          {
            name: String,
            price: Number,
            quantity: {
              type: Number,
              default: 1,
            },
          },
        ],
      },
      totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative'],
      },
    },
    payment: {
      method: {
        type: String,
        enum: ['card', 'paypal', 'bank-transfer', 'cash', 'other'],
        required: [true, 'Payment method is required'],
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially-refunded'],
        default: 'pending',
      },
      transactionId: String,
      stripePaymentIntentId: String,
      paidAmount: {
        type: Number,
        default: 0,
        min: [0, 'Paid amount cannot be negative'],
      },
      paidAt: Date,
      refundAmount: {
        type: Number,
        default: 0,
        min: [0, 'Refund amount cannot be negative'],
      },
      refundedAt: Date,
      refundReason: String,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'checked-in',
        'checked-out',
        'cancelled',
        'no-show',
        'completed',
      ],
      default: 'pending',
    },
    specialRequests: {
      type: String,
      maxlength: [500, 'Special requests cannot exceed 500 characters'],
    },
    source: {
      type: String,
      enum: ['website', 'mobile-app', 'phone', 'email', 'walk-in', 'third-party'],
      default: 'website',
    },
    confirmationCode: {
      type: String,
      unique: true,
      required: true,
    },
    cancellation: {
      isCancelled: {
        type: Boolean,
        default: false,
      },
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: {
        type: String,
        enum: [
          'guest-request',
          'hotel-cancellation',
          'payment-failure',
          'overbooking',
          'force-majeure',
          'other',
        ],
      },
      refundPolicy: {
        type: String,
        enum: ['full-refund', 'partial-refund', 'no-refund'],
      },
      refundAmount: {
        type: Number,
        default: 0,
      },
    },
    checkInOut: {
      actualCheckIn: Date,
      actualCheckOut: Date,
      earlyCheckIn: {
        type: Boolean,
        default: false,
      },
      lateCheckOut: {
        type: Boolean,
        default: false,
      },
      noShow: {
        type: Boolean,
        default: false,
      },
    },
    communications: [
      {
        type: {
          type: String,
          enum: ['email', 'sms', 'call', 'in-person'],
          required: true,
        },
        subject: String,
        message: String,
        sentAt: {
          type: Date,
          default: Date.now,
        },
        sentBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['sent', 'delivered', 'failed', 'opened'],
          default: 'sent',
        },
      },
    ],
    notes: [
      {
        note: {
          type: String,
          required: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        isPrivate: {
          type: Boolean,
          default: false,
        },
      },
    ],
    lastModified: {
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      at: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
        enum: ['created', 'updated', 'confirmed', 'cancelled', 'checked-in', 'checked-out'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
bookingSchema.index({ bookingId: 1 }, { unique: true });
bookingSchema.index({ confirmationCode: 1 }, { unique: true });
bookingSchema.index({ user: 1 });
bookingSchema.index({ hotel: 1 });
bookingSchema.index({ room: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ 'dates.checkIn': 1, 'dates.checkOut': 1 });
bookingSchema.index({ createdAt: -1 });

// Compound indexes
bookingSchema.index({ hotel: 1, status: 1, 'dates.checkIn': 1 });
bookingSchema.index({ user: 1, status: 1, createdAt: -1 });

// Virtual for booking duration in days
bookingSchema.virtual('duration').get(function () {
  return this.dates.nights;
});

// Virtual for booking total guests
bookingSchema.virtual('totalGuestsCount').get(function () {
  return (
    this.guestDetails.totalGuests.adults +
    this.guestDetails.totalGuests.children +
    this.guestDetails.totalGuests.infants
  );
});

// Virtual for booking status label
bookingSchema.virtual('statusLabel').get(function () {
  const statusLabels = {
    pending: 'Pending Confirmation',
    confirmed: 'Confirmed',
    'checked-in': 'Checked In',
    'checked-out': 'Checked Out',
    cancelled: 'Cancelled',
    'no-show': 'No Show',
    completed: 'Completed',
  };
  return statusLabels[this.status] || this.status;
});

// Pre-save middleware to calculate nights and generate IDs
bookingSchema.pre('save', function (next) {
  // Calculate nights
  if (this.dates.checkIn && this.dates.checkOut) {
    const timeDiff = this.dates.checkOut - this.dates.checkIn;
    this.dates.nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }
  
  // Generate booking ID if not exists
  if (!this.bookingId) {
    this.bookingId = this.generateBookingId();
  }
  
  // Generate confirmation code if not exists
  if (!this.confirmationCode) {
    this.confirmationCode = this.generateConfirmationCode();
  }
  
  next();
});

// Instance method to generate booking ID
bookingSchema.methods.generateBookingId = function () {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK${timestamp}${random}`.toUpperCase();
};

// Instance method to generate confirmation code
bookingSchema.methods.generateConfirmationCode = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Instance method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function () {
  if (this.status === 'cancelled' || this.status === 'completed') {
    return false;
  }
  
  // Check cancellation deadline (24 hours before check-in by default)
  const cancellationDeadline = new Date(this.dates.checkIn);
  cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);
  
  return Date.now() < cancellationDeadline.getTime();
};

// Instance method to calculate refund amount
bookingSchema.methods.calculateRefundAmount = function (refundPolicy) {
  const totalPaid = this.payment.paidAmount;
  
  switch (refundPolicy) {
    case 'full-refund':
      return totalPaid;
    case 'partial-refund':
      // 50% refund for partial policy
      return totalPaid * 0.5;
    case 'no-refund':
    default:
      return 0;
  }
};

// Instance method to cancel booking
bookingSchema.methods.cancel = async function (cancelledBy, reason, refundPolicy) {
  this.status = 'cancelled';
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.reason = reason;
  this.cancellation.refundPolicy = refundPolicy;
  this.cancellation.refundAmount = this.calculateRefundAmount(refundPolicy);
  
  this.lastModified.by = cancelledBy;
  this.lastModified.at = new Date();
  this.lastModified.action = 'cancelled';
  
  return this.save();
};

// Instance method to confirm booking
bookingSchema.methods.confirm = async function (confirmedBy) {
  this.status = 'confirmed';
  this.payment.status = 'completed';
  this.payment.paidAt = new Date();
  
  this.lastModified.by = confirmedBy;
  this.lastModified.at = new Date();
  this.lastModified.action = 'confirmed';
  
  return this.save();
};

// Static method to find bookings by date range
bookingSchema.statics.findByDateRange = function (startDate, endDate, hotelId = null) {
  const query = {
    $or: [
      {
        'dates.checkIn': { $gte: startDate, $lte: endDate },
      },
      {
        'dates.checkOut': { $gte: startDate, $lte: endDate },
      },
      {
        'dates.checkIn': { $lte: startDate },
        'dates.checkOut': { $gte: endDate },
      },
    ],
  };
  
  if (hotelId) {
    query.hotel = hotelId;
  }
  
  return this.find(query).populate('user hotel room');
};

// Static method to get booking statistics
bookingSchema.statics.getStatistics = function (hotelId, startDate, endDate) {
  const matchQuery = {
    createdAt: { $gte: startDate, $lte: endDate },
  };
  
  if (hotelId) {
    matchQuery.hotel = mongoose.Types.ObjectId(hotelId);
  }
  
  return this.aggregate([
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
      },
    },
  ]);
};

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
