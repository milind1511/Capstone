const mongoose = require('mongoose');

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
  
  // Use test database
  if (!process.env.MONGODB_TEST_URI) {
    process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/booking-platform-test';
  }
});

// Global test cleanup
afterAll(async () => {
  // Close database connections
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection in tests:', err.message);
});

module.exports = {};
