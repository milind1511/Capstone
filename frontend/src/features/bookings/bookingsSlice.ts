import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface Guest {
  name: string;
  email: string;
  phone: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  price: number;
}

export interface Booking {
  _id: string;
  hotel: {
    _id: string;
    name: string;
    location: {
      address: string;
      city: string;
      country: string;
    };
    policies: {
      checkInTime: string;
      checkOutTime: string;
      cancellationPolicy: string;
    };
  };
  room: Room;
  guest: Guest;
  checkIn: string;
  checkOut: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  confirmationCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingsState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingsState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/bookings/my-bookings');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData: {
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guestDetails: Guest;
    totalAmount: number;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/v1/bookings', bookingData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/v1/bookings/${bookingId}/cancel`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const fetchBookingByConfirmation = createAsyncThunk(
  'bookings/fetchBookingByConfirmation',
  async (confirmationCode: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/bookings/confirmation/${confirmationCode}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking');
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.isLoading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
        state.bookings = [...state.bookings, action.payload];
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Cancel Booking
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.isLoading = false;
        const updatedBooking = action.payload;
        state.bookings = state.bookings.map(booking =>
          booking._id === updatedBooking._id ? updatedBooking : booking
        );
        if (state.currentBooking?._id === updatedBooking._id) {
          state.currentBooking = updatedBooking;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Booking by Confirmation
      .addCase(fetchBookingByConfirmation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingByConfirmation.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingByConfirmation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentBooking, clearError } = bookingsSlice.actions;
export default bookingsSlice.reducer;
