const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

// Test database setup
const setupTestDB = () => {
  beforeAll(async () => {
    // Connect to test database
    process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/booking-platform-test';
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });
};

describe('API Health Check', () => {
  setupTestDB();

  test('GET /health should return 200', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('API is running');
  });

  test('GET /api/v1 should return API info', async () => {
    const res = await request(app)
      .get('/api/v1')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Booking Platform API v1');
    expect(res.body.endpoints).toHaveProperty('auth');
    expect(res.body.endpoints).toHaveProperty('hotels');
    expect(res.body.endpoints).toHaveProperty('bookings');
  });
});

describe('Authentication Endpoints', () => {
  setupTestDB();

  describe('POST /api/v1/auth/register', () => {
    test('Should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'guest'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.user.name).toBe(userData.name);
      expect(res.body.data).toHaveProperty('token');
    });

    test('Should not register user with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        role: 'guest'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('Should not register user with short password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        role: 'guest'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'guest',
        isEmailVerified: true
      });
      await user.save();
    });

    test('Should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(loginData.email);
    });

    test('Should not login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});

describe('Protected Routes', () => {
  setupTestDB();

  let authToken;
  let userId;

  beforeEach(async () => {
    // Create and authenticate a test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'guest',
      isEmailVerified: true
    });
    await user.save();
    userId = user._id;

    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
  });

  test('GET /api/v1/auth/me should return user data with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
  });

  test('GET /api/v1/auth/me should return 401 without token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

module.exports = {
  setupTestDB
};
