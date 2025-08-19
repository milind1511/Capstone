import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load pages
const HomePage = lazy(() => import('../pages/Home'));
const HotelsPage = lazy(() => import('../pages/Hotels'));
const HotelDetailsPage = lazy(() => import('../pages/HotelDetails'));
const LoginPage = lazy(() => import('../pages/Login'));
const RegisterPage = lazy(() => import('../pages/Register'));
const MyBookingsPage = lazy(() => import('../pages/MyBookings'));
const BookingConfirmationPage = lazy(() => import('../pages/BookingConfirmation'));
const ProfilePage = lazy(() => import('../pages/Profile'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

// Loading component
const Loading = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout><Outlet /></MainLayout>,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'hotels',
        element: (
          <Suspense fallback={<Loading />}>
            <HotelsPage />
          </Suspense>
        ),
      },
      {
        path: 'hotels/:id',
        element: (
          <Suspense fallback={<Loading />}>
            <HotelDetailsPage />
          </Suspense>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={<Loading />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<Loading />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: 'my-bookings',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <MyBookingsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'booking/:confirmationCode',
        element: (
          <Suspense fallback={<Loading />}>
            <BookingConfirmationPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '404',
        element: (
          <Suspense fallback={<Loading />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
