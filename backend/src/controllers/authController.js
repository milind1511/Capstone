const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');
const { ErrorResponse } = require('../middleware/error');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role: role || 'guest',
  });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Email Verification - BookingApp',
      template: 'emailVerification',
      data: {
        name: user.firstName,
        verificationUrl,
      },
    });
  } catch (error) {
    console.error('Email verification send failed:', error);
    // Don't fail registration if email fails
  }

  sendTokenResponse(user, 201, res, 'User registered successfully');
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(
      new ErrorResponse(
        'Account is temporarily locked due to failed login attempts',
        423
      )
    );
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Increment login attempts
    await user.incLoginAttempts();
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: 'preferences',
    select: 'currency language notifications',
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    dateOfBirth: req.body.dateOfBirth,
    address: req.body.address,
    preferences: req.body.preferences,
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(
    (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
    message: 'Profile updated successfully',
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request - BookingApp',
      template: 'passwordReset',
      data: {
        name: user.firstName,
        resetUrl,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    console.error('Password reset email failed:', error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// @desc    Verify email
// @route   GET /api/v1/auth/verifyemail/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification token', 400));
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

// @desc    Resend email verification
// @route   POST /api/v1/auth/resend-verification
// @access  Private
const resendEmailVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return next(new ErrorResponse('Email is already verified', 400));
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Email Verification - BookingApp',
      template: 'emailVerification',
      data: {
        name: user.firstName,
        verificationUrl,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Email verification send failed:', error);
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, message) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    data: user,
    message,
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
};
