# Booking Platform Frontend

A modern React-based frontend for a Booking.com-like hotel reservation platform built with the MERN stack.

## Features

- **User Authentication**: Complete user authentication flow with JWT
- **Hotel Listings**: Dynamic hotel listings with filtering and sorting
- **Hotel Details**: Comprehensive hotel information with photo galleries and amenities
- **Booking System**: Intuitive booking flow with date selection and room options
- **Review System**: User reviews and ratings with interactive star ratings
- **User Dashboard**: Personal booking history and user preferences
- **Responsive Design**: Mobile-first approach using Tailwind CSS
- **Protected Routes**: Role-based access control for secure pages
- **Form Validation**: Client-side validation with error handling
- **State Management**: Centralized state management with Redux Toolkit

## Technology Stack

- **Framework**: React with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **UI Components**: HeadlessUI & HeroIcons
- **Build Tool**: Vite
- **Form Handling**: React Hook Form (to be added)
- **HTTP Client**: Axios
- **Date Handling**: date-fns (to be added)

## Project Structure

```plaintext
frontend/
├── src/
│   ├── components/
│   │   ├── hotels/
│   │   │   └── HotelCard.tsx    # Hotel card component
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx   # Main layout wrapper
│   │   ├── reviews/
│   │   │   ├── ReviewForm.tsx   # Review submission form
│   │   │   └── ReviewList.tsx   # Reviews display
│   │   └── users/
│   │       └── UserPreferencesForm.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   └── authSlice.ts     # Authentication state
│   │   ├── bookings/
│   │   │   └── bookingsSlice.ts # Bookings state
│   │   ├── hotels/
│   │   │   └── hotelsSlice.ts   # Hotels state
│   │   └── reviews/
│   │       └── reviewsSlice.ts  # Reviews state
│   ├── pages/
│   │   ├── BookingConfirmation.tsx
│   │   ├── Home.tsx
│   │   ├── HotelDetails.tsx
│   │   ├── Hotels.tsx
│   │   ├── Login.tsx
│   │   ├── MyBookings.tsx
│   │   ├── NotFound.tsx
│   │   ├── Profile.tsx
│   │   └── Register.tsx
│   ├── routes/
│   │   ├── ProtectedRoute.tsx   # Auth route protection
│   │   └── router.tsx           # Route definitions
│   ├── services/
│   │   └── api.ts               # API service setup
│   ├── store.ts                 # Redux store config
│   └── App.tsx                  # Main app component
├── index.html
├── package.json                 # Dependencies & scripts
└── vite.config.ts              # Vite configuration
```

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Clone and navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**
   Create a `.env` file:

   ```env
   VITE_API_URL="http://localhost:3000/api"
   ```

### Development

1. **Start development server**

   ```bash
   npm run dev
   ```

   This will start the development server at `http://localhost:5173`

2. **Build for production**

   ```bash
   npm run build
   ```

3. **Preview production build**

   ```bash
   npm run preview
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm test` - Run tests (when added)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | `http://localhost:3000/api` |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React Team for the amazing framework
- Vite Team for the blazing fast build tool
- Tailwind CSS Team for the utility-first CSS framework
- HeadlessUI Team for accessible components
