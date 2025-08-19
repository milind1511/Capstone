import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Amenity {
  name: string;
  description: string;
  icon: string;
}

export interface Room {
  _id: string;
  type: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  available: boolean;
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  hotel: string;
  rating: number;
  comment: string;
  response?: string;
  createdAt: string;
}

export interface Hotel {
  _id: string;
  name: string;
  description: string;
  location: Location;
  rating: number;
  images: string[];
  amenities: Amenity[];
  rooms: Room[];
  priceRange: {
    min: number;
    max: number;
  };
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  policies: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
  };
}

interface HotelsState {
  hotels: Hotel[];
  currentHotel: Hotel | null;
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  filters: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sort?: string;
  };
}

const initialState: HotelsState = {
  hotels: [],
  currentHotel: null,
  reviews: [],
  isLoading: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchHotels = createAsyncThunk(
  'hotels/fetchHotels',
  async (filters: Partial<HotelsState['filters']>, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/hotels', { params: filters });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotels');
    }
  }
);

export const fetchHotelById = createAsyncThunk(
  'hotels/fetchHotelById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/hotels/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel');
    }
  }
);

export const searchHotels = createAsyncThunk(
  'hotels/searchHotels',
  async (searchParams: { query: string; filters?: Partial<HotelsState['filters']> }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/search/hotels', { params: searchParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchHotelReviews = createAsyncThunk(
  'hotels/fetchHotelReviews',
  async (hotelId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/hotels/${hotelId}/reviews`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<HotelsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearCurrentHotel: (state) => {
      state.currentHotel = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Hotels
      .addCase(fetchHotels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action: PayloadAction<Hotel[]>) => {
        state.isLoading = false;
        state.hotels = action.payload;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Hotel by ID
      .addCase(fetchHotelById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotelById.fulfilled, (state, action: PayloadAction<Hotel>) => {
        state.isLoading = false;
        state.currentHotel = action.payload;
      })
      .addCase(fetchHotelById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search Hotels
      .addCase(searchHotels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchHotels.fulfilled, (state, action: PayloadAction<Hotel[]>) => {
        state.isLoading = false;
        state.hotels = action.payload;
      })
      .addCase(searchHotels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Hotel Reviews
      .addCase(fetchHotelReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotelReviews.fulfilled, (state, action: PayloadAction<Review[]>) => {
        state.isLoading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchHotelReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearCurrentHotel } = hotelsSlice.actions;
export default hotelsSlice.reducer;
