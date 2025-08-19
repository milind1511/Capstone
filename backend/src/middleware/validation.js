const { body, param, query, validationResult } = require('express-validator');
const { ErrorResponse } = require('./error');

// Check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: extractedErrors,
    });
  }
  
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('phone')
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    body('role')
      .optional()
      .isIn(['guest', 'owner', 'admin'])
      .withMessage('Role must be guest, owner, or admin'),
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date'),
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
  ],
};

// Hotel validation rules
const hotelValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Hotel name must be between 2 and 100 characters'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    
    body('location.address')
      .trim()
      .notEmpty()
      .withMessage('Address is required'),
    
    body('location.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    
    body('location.state')
      .trim()
      .notEmpty()
      .withMessage('State is required'),
    
    body('location.country')
      .trim()
      .notEmpty()
      .withMessage('Country is required'),
    
    body('location.zipCode')
      .trim()
      .notEmpty()
      .withMessage('Zip code is required'),
    
    body('location.coordinates.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    
    body('location.coordinates.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    
    body('category')
      .isIn(['hotel', 'resort', 'apartment', 'villa', 'guesthouse', 'hostel', 'boutique', 'luxury', 'budget'])
      .withMessage('Invalid hotel category'),
    
    body('starRating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Star rating must be between 1 and 5'),
    
    body('contact.phone')
      .isMobilePhone()
      .withMessage('Please provide a valid contact phone'),
    
    body('contact.email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid contact email'),
    
    body('contact.website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid website URL'),
    
    body('priceRange.min')
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    
    body('priceRange.max')
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number')
      .custom((value, { req }) => {
        if (value < req.body.priceRange?.min) {
          throw new Error('Maximum price must be greater than minimum price');
        }
        return true;
      }),
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Hotel name must be between 2 and 100 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    
    body('starRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Star rating must be between 1 and 5'),
  ],
};

// Room validation rules
const roomValidation = {
  create: [
    body('roomNumber')
      .trim()
      .notEmpty()
      .withMessage('Room number is required'),
    
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Room name must be between 2 and 100 characters'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    
    body('type')
      .isIn(['single', 'double', 'twin', 'triple', 'quad', 'king', 'queen', 'suite', 'deluxe', 'presidential', 'family', 'connecting'])
      .withMessage('Invalid room type'),
    
    body('capacity.adults')
      .isInt({ min: 1, max: 10 })
      .withMessage('Adult capacity must be between 1 and 10'),
    
    body('capacity.children')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Children capacity must be between 0 and 6'),
    
    body('size.area')
      .isFloat({ min: 10 })
      .withMessage('Room area must be at least 10 square meters'),
    
    body('pricing.basePrice')
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Room name must be between 2 and 100 characters'),
    
    body('pricing.basePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
  ],
};

// Booking validation rules
const bookingValidation = {
  create: [
    body('hotel')
      .isMongoId()
      .withMessage('Invalid hotel ID'),
    
    body('room')
      .isMongoId()
      .withMessage('Invalid room ID'),
    
    body('dates.checkIn')
      .isISO8601()
      .withMessage('Invalid check-in date')
      .custom((value) => {
        const checkIn = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (checkIn < today) {
          throw new Error('Check-in date cannot be in the past');
        }
        return true;
      }),
    
    body('dates.checkOut')
      .isISO8601()
      .withMessage('Invalid check-out date')
      .custom((value, { req }) => {
        const checkOut = new Date(value);
        const checkIn = new Date(req.body.dates?.checkIn);
        
        if (checkOut <= checkIn) {
          throw new Error('Check-out date must be after check-in date');
        }
        return true;
      }),
    
    body('guestDetails.totalGuests.adults')
      .isInt({ min: 1 })
      .withMessage('At least one adult is required'),
    
    body('guestDetails.primaryGuest.firstName')
      .trim()
      .notEmpty()
      .withMessage('Primary guest first name is required'),
    
    body('guestDetails.primaryGuest.lastName')
      .trim()
      .notEmpty()
      .withMessage('Primary guest last name is required'),
    
    body('guestDetails.primaryGuest.email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid primary guest email is required'),
    
    body('guestDetails.primaryGuest.phone')
      .isMobilePhone()
      .withMessage('Valid primary guest phone is required'),
  ],
};

// Review validation rules
const reviewValidation = {
  create: [
    body('booking')
      .isMongoId()
      .withMessage('Invalid booking ID'),
    
    body('ratings.overall')
      .isInt({ min: 1, max: 5 })
      .withMessage('Overall rating must be between 1 and 5'),
    
    body('review.title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Review title must be between 5 and 100 characters'),
    
    body('review.comment')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Review comment must be between 10 and 2000 characters'),
    
    body('guestInfo.travelType')
      .isIn(['business', 'leisure', 'family', 'couple', 'solo', 'group'])
      .withMessage('Invalid travel type'),
    
    body('guestInfo.travelDate')
      .isISO8601()
      .withMessage('Invalid travel date'),
  ],
  
  update: [
    body('ratings.overall')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Overall rating must be between 1 and 5'),
    
    body('review.title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Review title must be between 5 and 100 characters'),
    
    body('review.comment')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Review comment must be between 10 and 2000 characters'),
  ],
  
  report: [
    body('reason')
      .notEmpty()
      .isIn(['inappropriate', 'spam', 'fake', 'offensive', 'other'])
      .withMessage('Invalid report reason'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],
};

// Search validation rules
const searchValidation = {
  hotels: [
    query('destination')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Destination must be at least 2 characters'),
    
    query('checkIn')
      .optional()
      .isISO8601()
      .withMessage('Invalid check-in date'),
    
    query('checkOut')
      .optional()
      .isISO8601()
      .withMessage('Invalid check-out date'),
    
    query('adults')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Adults must be between 1 and 10'),
    
    query('children')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Children must be between 0 and 6'),
    
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),
    
    query('starRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Star rating must be between 1 and 5'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  
  roomAvailability: [
    query('checkIn')
      .notEmpty()
      .isISO8601()
      .withMessage('Valid check-in date is required'),
    
    query('checkOut')
      .notEmpty()
      .isISO8601()
      .withMessage('Valid check-out date is required')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.query.checkIn)) {
          throw new Error('Check-out date must be after check-in date');
        }
        return true;
      }),
    
    query('adults')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Adults must be between 1 and 10'),
    
    query('children')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Children must be between 0 and 6'),
  ],
  
  location: [
    query('q')
      .notEmpty()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Location query must be at least 2 characters'),
  ],
  
  advanced: [
    body('destination')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Destination must be at least 2 characters'),
    
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filters must be an object'),
    
    body('sorting')
      .optional()
      .isObject()
      .withMessage('Sorting must be an object'),
  ],
};

// Parameter validation rules
const paramValidation = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format'),
  ],
};

module.exports = {
  checkValidation,
  userValidation,
  hotelValidation,
  roomValidation,
  bookingValidation,
  reviewValidation,
  searchValidation,
  paramValidation,
};
