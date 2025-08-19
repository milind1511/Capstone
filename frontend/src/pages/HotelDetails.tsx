import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  StarIcon,
  MapPinIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchHotelById } from '../features/hotels/hotelsSlice';
import { createBooking } from '../features/bookings/bookingsSlice';
import type { Room } from '../features/hotels/hotelsSlice';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function HotelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentHotel, isLoading, error } = useAppSelector((state) => state.hotels);
  const { user } = useAppSelector((state) => state.auth);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    selectedRoomId: '',
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [validationErrors, setValidationErrors] = useState({
    checkIn: '',
    checkOut: '',
    roomId: '',
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchHotelById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut && bookingData.selectedRoomId && currentHotel) {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const selectedRoom = currentHotel.rooms.find(room => room._id === bookingData.selectedRoomId);
      if (selectedRoom) {
        setTotalPrice(selectedRoom.price * nights);
      }
    }
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.selectedRoomId, currentHotel]);

  const validateBookingData = () => {
    const errors = {
      checkIn: '',
      checkOut: '',
      roomId: '',
    };

    if (!bookingData.checkIn) {
      errors.checkIn = 'Check-in date is required';
    }
    if (!bookingData.checkOut) {
      errors.checkOut = 'Check-out date is required';
    }
    if (!bookingData.selectedRoomId) {
      errors.roomId = 'Please select a room';
    }

    if (bookingData.checkIn && bookingData.checkOut) {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      
      if (checkIn >= checkOut) {
        errors.checkOut = 'Check-out date must be after check-in date';
      }
    }

    setValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/hotels/${id}` } });
      return;
    }

    if (!currentHotel) return;

    if (!validateBookingData()) {
      return;
    }

    if (!bookingData.selectedRoomId) {
      setValidationErrors(prev => ({ ...prev, roomId: 'Please select a room' }));
      return;
    }

    const result = await dispatch(
      createBooking({
        hotelId: currentHotel._id,
        roomId: bookingData.selectedRoomId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guestDetails: {
          name: user.name,
          email: user.email,
          phone: user.phone || '',
        },
        totalAmount: totalPrice,
      })
    );

    if (createBooking.fulfilled.match(result)) {
      navigate(`/booking/${result.payload.confirmationCode}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !currentHotel) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {error || 'Hotel not found'}
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            We couldn't find the hotel you're looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
          {/* Images */}
          <div className="aspect-h-2 aspect-w-3 overflow-hidden rounded-lg lg:block">
            <img
              src={currentHotel.images[selectedImage]}
              alt={currentHotel.name}
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Hotel info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{currentHotel.name}</h1>

            <div className="mt-3">
              <div className="flex items-center">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <StarIcon
                      key={rating}
                      className={classNames(
                        currentHotel.rating > rating ? 'text-yellow-400' : 'text-gray-300',
                        'h-5 w-5 flex-shrink-0'
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="ml-3 text-sm text-gray-500">{currentHotel.rating} out of 5 stars</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <MapPinIcon className="mr-1 h-5 w-5" />
                {currentHotel.location.address}, {currentHotel.location.city},{' '}
                {currentHotel.location.country}
              </div>
            </div>

            <div className="mt-6">
              <h2 className="sr-only">Hotel description</h2>
              <p className="space-y-6 text-base text-gray-700">{currentHotel.description}</p>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Amenities</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {currentHotel.amenities.map((amenity) => (
                  <div
                    key={amenity.name}
                    className="flex items-center rounded-lg border border-gray-200 p-4"
                  >
                    <span className="mr-4 text-2xl">{amenity.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{amenity.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{amenity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Gallery Navigation */}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {currentHotel.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={classNames(
                    'relative aspect-square overflow-hidden rounded-lg',
                    selectedImage === index ? 'ring-2 ring-indigo-500' : ''
                  )}
                >
                  <img
                    src={image}
                    alt={`${currentHotel.name} view ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="text-lg font-medium text-gray-900">Book Your Stay</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="check-in" className="block text-sm font-medium text-gray-700">
                    Check-in Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="check-in"
                      min={new Date().toISOString().split('T')[0]}
                      className={classNames(
                        "block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                        validationErrors.checkIn ? "border-red-300" : "border-gray-300"
                      )}
                      value={bookingData.checkIn}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, checkIn: e.target.value }))
                      }
                    />
                    {validationErrors.checkIn && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.checkIn}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="check-out" className="block text-sm font-medium text-gray-700">
                    Check-out Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="check-out"
                      min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                      className={classNames(
                        "block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                        validationErrors.checkOut ? "border-red-300" : "border-gray-300"
                      )}
                      value={bookingData.checkOut}
                      onChange={(e) =>
                        setBookingData((prev) => ({ ...prev, checkOut: e.target.value }))
                      }
                    />
                    {validationErrors.checkOut && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.checkOut}</p>
                    )}
                  </div>
                </div>

                {/* Room Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Available Rooms</h3>
                  {currentHotel.rooms.map((room: Room) => (
                    <div
                      key={room._id}
                      className={classNames(
                        "relative flex items-center space-x-3 rounded-lg border p-4",
                        bookingData.selectedRoomId === room._id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-300"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`room-${room._id}`}
                          className="cursor-pointer select-none"
                        >
                          <div className="font-medium text-gray-900">{room.type}</div>
                          <div className="text-sm text-gray-500">{room.description}</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            ${room.price} per night
                          </div>
                        </label>
                      </div>
                      <div className="flex h-5 items-center">
                        <input
                          id={`room-${room._id}`}
                          name="room"
                          type="radio"
                          className="h-4 w-4 cursor-pointer border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={bookingData.selectedRoomId === room._id}
                          onChange={() =>
                            setBookingData((prev) => ({ ...prev, selectedRoomId: room._id }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                  {validationErrors.roomId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.roomId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
                    Number of Guests
                  </label>
                  <select
                    id="guests"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={bookingData.guests}
                    onChange={(e) =>
                      setBookingData((prev) => ({ ...prev, guests: Number(e.target.value) }))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!bookingData.selectedRoomId || !bookingData.checkIn || !bookingData.checkOut}
                  className={classNames(
                    "flex w-full items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                    (!bookingData.selectedRoomId || !bookingData.checkIn || !bookingData.checkOut)
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  )}
                >
                  {totalPrice > 0
                    ? `Book Now - Total: $${totalPrice}`
                    : 'Select dates and room to see total price'}
                </button>
              </div>
            </div>

            {/* Policies */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h2 className="text-lg font-medium text-gray-900">Policies</h2>
              <div className="mt-4 space-y-6">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <p className="ml-2 text-sm text-gray-500">
                    Check-in: {currentHotel.policies.checkInTime} • Check-out:{' '}
                    {currentHotel.policies.checkOutTime}
                  </p>
                </div>
                <p className="text-sm text-gray-500">{currentHotel.policies.cancellationPolicy}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
