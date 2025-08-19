import { useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchHotelReviews } from '../../features/hotels/hotelsSlice';
import type { Review } from '../../features/hotels/hotelsSlice';

interface ReviewListProps {
  hotelId: string;
}

export default function ReviewList({ hotelId }: ReviewListProps) {
  const dispatch = useAppDispatch();
  const { reviews, isLoading: isLoadingReviews } = useAppSelector((state) => state.hotels);

  useEffect(() => {
    dispatch(fetchHotelReviews(hotelId));
  }, [hotelId, dispatch]);

  if (isLoadingReviews) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-gray-100 p-4">
            <div className="h-4 w-24 rounded bg-gray-300"></div>
            <div className="mt-2 h-4 w-full rounded bg-gray-300"></div>
            <div className="mt-1 h-4 w-2/3 rounded bg-gray-300"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <div className="text-center">
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review: Review) => (
        <div key={review._id} className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{review.user.name}</h4>
              <div className="mt-1 flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-2 text-gray-600">{review.comment}</p>
          {review.response && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">
                Response from the property:
              </p>
              <p className="mt-1 text-sm text-gray-600">{review.response}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
