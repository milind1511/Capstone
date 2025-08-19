import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

interface HotelReview {
  rating: number;
  comment: string;
  hotelId: string;
}

export const fetchHotelReviews = createAsyncThunk(
  'hotels/fetchHotelReviews',
  async (hotelId: string) => {
    const response = await api.get(`/hotels/${hotelId}/reviews`);
    return response.data.data;
  }
);

export const createReview = createAsyncThunk(
  'hotels/createReview',
  async (review: HotelReview) => {
    const response = await api.post(`/hotels/${review.hotelId}/reviews`, {
      rating: review.rating,
      comment: review.comment,
    });
    return response.data.data;
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [] as Review[],
    isLoadingReviews: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelReviews.pending, (state) => {
        state.isLoadingReviews = true;
        state.error = null;
      })
      .addCase(fetchHotelReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
        state.isLoadingReviews = false;
      })
      .addCase(fetchHotelReviews.rejected, (state, action) => {
        state.isLoadingReviews = false;
        state.error = action.error.message || 'Failed to fetch reviews';
      })
      .addCase(createReview.pending, (state) => {
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.reviews.unshift(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create review';
      });
  },
});

export default reviewsSlice.reducer;
