import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMyBookings, cancelBooking } from '../features/bookings/bookingsSlice';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  pending: ClockIcon,
  confirmed: CheckCircleIcon,
  cancelled: XCircleIcon,
  completed: CheckCircleIcon,
};

export default function MyBookings() {
  const dispatch = useAppDispatch();
  const { bookings, isLoading, error } = useAppSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await dispatch(cancelBooking(bookingId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="my-8 text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Bookings</h1>

          {bookings.length === 0 ? (
            <div className="mt-8 rounded-lg bg-white p-6 text-center shadow">
              <h2 className="text-lg font-medium text-gray-900">No bookings found</h2>
              <p className="mt-2 text-gray-500">
                You haven't made any bookings yet.{' '}
                <Link to="/hotels" className="text-indigo-600 hover:text-indigo-500">
                  Start browsing hotels
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {bookings.map((booking) => {
                const StatusIcon = statusIcons[booking.status];
                return (
                  <div
                    key={booking._id}
                    className="overflow-hidden rounded-lg bg-white shadow transition hover:shadow-md"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            {booking.hotel.name}
                          </h2>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <CalendarDaysIcon className="mr-1 h-5 w-5" />
                              {new Date(booking.checkIn).toLocaleDateString()} -{' '}
                              {new Date(booking.checkOut).toLocaleDateString()}
                            </div>
                            <div
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                statusColors[booking.status]
                              }`}
                            >
                              <StatusIcon className="mr-1 h-4 w-4" />
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium text-gray-900">${booking.totalAmount}</p>
                          <p className="text-sm text-gray-500">Confirmation #{booking.confirmationCode}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.room.type}</p>
                          <p className="text-sm text-gray-500">Room {booking.room.roomNumber}</p>
                        </div>
                        <div className="space-x-3">
                          <Link
                            to={`/booking/${booking.confirmationCode}`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            View Details
                          </Link>
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
