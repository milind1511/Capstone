# Booking Platform Backend API

A comprehensive Node.js/Express.js backend API for a Booking.com-like hotel reservation platform built with the MERN stack.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (Guest, Owner, Admin)
- **Hotel Management**: Complete CRUD operations for hotels with image uploads and approval workflows
- **Room Management**: Room inventory management with availability tracking and bulk operations
- **Booking System**: Full booking lifecycle with payment integration via Stripe
- **Review System**: User reviews with ratings, likes, and reporting functionality
- **Advanced Search**: Geospatial search, filtering, and location-based recommendations
- **Email Services**: Automated notifications using SendGrid/SMTP
- **Payment Processing**: Secure payment handling with Stripe integration
- **Security**: Comprehensive security middleware including rate limiting, sanitization, and CORS

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Payment**: Stripe API
- **Email**: SendGrid / SMTP
- **Maps**: Google Maps API
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize, xss-clean
- **Validation**: express-validator
- **File Upload**: Multer (ready for AWS S3 integration)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── hotelController.js   # Hotel management logic
│   │   ├── roomController.js    # Room management logic
│   │   ├── bookingController.js # Booking system logic
│   │   └── reviewController.js  # Review system logic
│   ├── middleware/
│   │   ├── auth.js             # Authentication & authorization
│   │   ├── error.js            # Error handling
│   │   └── validation.js       # Input validation rules
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Hotel.js            # Hotel schema
│   │   ├── Room.js             # Room schema
│   │   ├── Booking.js          # Booking schema
│   │   └── Review.js           # Review schema
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── hotels.js           # Hotel routes
│   │   ├── rooms.js            # Room routes
│   │   ├── bookings.js         # Booking routes
│   │   ├── reviews.js          # Review routes
│   │   └── search.js           # Search routes
│   ├── services/
│   │   └── searchService.js    # Search functionality
│   ├── utils/
│   │   └── sendEmail.js        # Email service
│   └── server.js               # Main application entry point
├── package.json                # Dependencies and scripts
└── .env.example               # Environment variables template
```

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Stripe account for payments
- SendGrid account for emails
- Google Maps API key

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/booking-platform
   JWT_SECRET=your-super-secret-jwt-key
   SENDGRID_API_KEY=your-sendgrid-api-key
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be running at `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints
```
POST   /auth/register          # User registration
POST   /auth/login             # User login
POST   /auth/logout            # User logout
GET    /auth/me                # Get current user
PUT    /auth/updatedetails     # Update user details
PUT    /auth/updatepassword    # Update password
POST   /auth/forgotpassword    # Password reset request
PUT    /auth/resetpassword/:resettoken  # Reset password
POST   /auth/verify-email      # Verify email address
```

### Hotel Endpoints
```
GET    /hotels                 # Get all hotels (with search/filter)
GET    /hotels/featured        # Get featured hotels
GET    /hotels/:id             # Get single hotel
POST   /hotels                 # Create hotel (Owner/Admin)
PUT    /hotels/:id             # Update hotel (Owner/Admin)
DELETE /hotels/:id             # Delete hotel (Owner/Admin)
GET    /hotels/owner/my-hotels # Get owner's hotels
PUT    /hotels/:id/approve     # Approve hotel (Admin)
```

### Room Endpoints
```
GET    /rooms                  # Get all rooms
GET    /rooms/available        # Get available rooms
GET    /rooms/:id              # Get single room
POST   /rooms                  # Create room (Owner/Admin)
PUT    /rooms/:id              # Update room (Owner/Admin)
DELETE /rooms/:id              # Delete room (Owner/Admin)
POST   /rooms/bulk             # Bulk create rooms (Owner/Admin)
```

### Booking Endpoints
```
GET    /bookings               # Get all bookings (Admin)
GET    /bookings/my-bookings   # Get user's bookings
GET    /bookings/:id           # Get single booking
POST   /bookings               # Create booking
PUT    /bookings/:id/cancel    # Cancel booking
POST   /bookings/payment/intent # Create payment intent
PUT    /bookings/:id/confirm   # Confirm booking (Owner)
PUT    /bookings/:id/checkin   # Check-in guest (Owner)
PUT    /bookings/:id/checkout  # Check-out guest (Owner)
```

### Review Endpoints
```
GET    /reviews                # Get all reviews
GET    /reviews/:id            # Get single review
POST   /reviews                # Create review
PUT    /reviews/:id            # Update review
DELETE /reviews/:id            # Delete review
GET    /reviews/user/my-reviews # Get user's reviews
PUT    /reviews/:id/like       # Like/unlike review
PUT    /reviews/:id/report     # Report review
```

### Search Endpoints
```
GET    /search/hotels          # Advanced hotel search
GET    /search/location/suggestions # Location autocomplete
GET    /search/destinations/popular # Popular destinations
POST   /search/advanced        # Advanced search with complex filters
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 5000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `JWT_EXPIRE` | JWT expiration time | No (default: 30d) |
| `SENDGRID_API_KEY` | SendGrid API key | Yes |
| `FROM_EMAIL` | Sender email address | Yes |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `CLIENT_URL` | Frontend application URL | Yes |

## Security Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (Guest, Owner, Admin)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Sanitization**: NoSQL injection prevention
- **XSS Protection**: Cross-site scripting prevention
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Comprehensive request validation

## Error Handling

The API uses a centralized error handling system with consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "stack": "Error stack (development only)"
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Production Checklist

1. **Environment Variables**: Set all required environment variables
2. **Database**: Configure production MongoDB instance
3. **Security**: Update CORS origins for production domains
4. **Monitoring**: Set up logging and monitoring
5. **SSL**: Configure HTTPS
6. **Process Management**: Use PM2 or similar for process management

### Docker Deployment

```bash
# Build Docker image
docker build -t booking-platform-backend .

# Run container
docker run -p 5000:5000 --env-file .env booking-platform-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@yourdomain.com or create an issue in the repository.

## Roadmap

- [ ] Redis caching implementation
- [ ] WebSocket integration for real-time notifications
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Mobile API optimizations
- [ ] GraphQL API endpoint
- [ ] Microservices architecture migration
