const express = require('express');
const {
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
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const {
  userValidation,
  checkValidation,
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', userValidation.register, checkValidation, register);
router.post('/login', userValidation.login, checkValidation, login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/verifyemail/:token', verifyEmail);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/logout', logout);
router.get('/me', getMe);
router.put('/updatedetails', userValidation.updateProfile, checkValidation, updateDetails);
router.put('/updatepassword', userValidation.changePassword, checkValidation, updatePassword);
router.post('/resend-verification', resendEmailVerification);

module.exports = router;
