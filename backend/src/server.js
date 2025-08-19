const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean'); // Deprecated - using helmet for XSS protection
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
}));

// Enable CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-domain.com', // Replace with your actual domain
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Prevent NoSQL injections
app.use(mongoSanitize());

// XSS protection is handled by helmet
// app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});

app.use('/api/', limiter);

// Prevent http param pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Mount routers
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/hotels', require('./routes/hotels'));
app.use('/api/v1/rooms', require('./routes/rooms'));
app.use('/api/v1/bookings', require('./routes/bookings'));
app.use('/api/v1/reviews', require('./routes/reviews'));
app.use('/api/v1/search', require('./routes/search'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
  });
});

// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Booking Platform API v1',
    endpoints: {
      auth: '/api/v1/auth',
      hotels: '/api/v1/hotels',
      rooms: '/api/v1/rooms',
      bookings: '/api/v1/bookings',
      reviews: '/api/v1/reviews',
      search: '/api/v1/search',
    },
    documentation: '/api/docs', // Future Swagger documentation
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`.red);
  console.log('Shutting down due to uncaught exception');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  console.log('Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
