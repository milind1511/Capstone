import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircleIcon, CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchBookingByConfirmation } from '../features/bookings/bookingsSlice';
import type { BookingsState } from '../features/bookings/bookingsSlice';

export default function BookingConfirmation() {
  const { confirmationCode } = useParams<{ confirmationCode: string }>();
  const dispatch = useAppDispatch();
  const { currentBooking, isLoading, error } = useAppSelector((state: { bookings: BookingsState }) => state.bookings);

  useEffect(() => {
    if (confirmationCode) {
      dispatch(fetchBookingByConfirmation(confirmationCode));
    }
  }, [confirmationCode, dispatch]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !currentBooking) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {error || 'Booking not found'}
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            We couldn't find the booking with the confirmation code provided.
          </p>
          <div className="mt-6">
            <Link
              to="/my-bookings"
              className="text-base font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          {/* Confirmation Header */}
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
              Booking Confirmed!
            </h1>
            <p className="mt-2 text-lg text-gray-500">
              Thank you for your booking. Your confirmation code is:
            </p>
            <p className="mt-2 text-2xl font-mono font-bold text-indigo-600">
              {currentBooking.confirmationCode}
            </p>
          </div>

          {/* Booking Details */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Booking Details</h2>
            <div className="mt-4 rounded-md bg-gray-50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Hotel</h3>
                  <p className="mt-1 text-sm text-gray-900">{currentBooking.hotel.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Room Type</h3>
                  <p className="mt-1 text-sm text-gray-900">{currentBooking.room.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Check-in</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(currentBooking.checkIn).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Check-out</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(currentBooking.checkOut).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Guest Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{currentBooking.guest.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    ${currentBooking.totalAmount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mt-8 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Payment Successful</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your payment has been processed successfully.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Important Information</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center text-sm text-gray-500">
                <CalendarDaysIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  Check-in time: {currentBooking.hotel.policies?.checkInTime || '3:00 PM'} • Check-out
                  time: {currentBooking.hotel.policies?.checkOutTime || '11:00 AM'}
                </p>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPinIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  {currentBooking.hotel.location?.address}, {currentBooking.hotel.location?.city},{' '}
                  {currentBooking.hotel.location?.country}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between border-t pt-8">
            <Link
              to={`/hotels/${currentBooking.hotel._id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View Hotel Details
            </Link>
            <Link
              to="/my-bookings"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              View All Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
