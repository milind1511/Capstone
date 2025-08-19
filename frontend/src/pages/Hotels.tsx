import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FunnelIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchHotels, setFilters } from '../features/hotels/hotelsSlice';
import HotelCard from '../components/hotels/HotelCard';

const sortOptions = [
  { name: 'Most Popular', value: 'popular' },
  { name: 'Price: Low to High', value: 'price_asc' },
  { name: 'Price: High to Low', value: 'price_desc' },
  { name: 'Rating: High to Low', value: 'rating_desc' },
];

const ratings = [5, 4, 3, 2, 1];

export default function Hotels() {
  const dispatch = useAppDispatch();
  const { hotels, isLoading, error, filters } = useAppSelector((state) => state.hotels);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Initialize filters from URL params
  useEffect(() => {
    const newFilters: {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
} = {};
    const locationParam = searchParams.get('location');
    if (locationParam) newFilters.city = locationParam;
    if (searchParams.has('minPrice')) newFilters.minPrice = Number(searchParams.get('minPrice'));
    if (searchParams.has('maxPrice')) newFilters.maxPrice = Number(searchParams.get('maxPrice'));
    if (searchParams.has('rating')) newFilters.rating = Number(searchParams.get('rating'));
    dispatch(setFilters(newFilters));
  }, [searchParams, dispatch]);

  // Fetch hotels when filters change
  useEffect(() => {
    dispatch(fetchHotels(filters));
  }, [filters, dispatch]);

  const handleFilterChange = (filterType: string, value: string | number) => {
    const newFilters = { ...filters, [filterType]: value };
    dispatch(setFilters(newFilters));

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set(filterType, value.toString());
    setSearchParams(newParams);
  };

  const handleSortChange = (sortValue: string) => {
    handleFilterChange('sort', sortValue);
    // Implement sorting logic
  };

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Hotels in {filters.city || 'All Locations'}
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <FunnelIcon className="mr-2 h-5 w-5" />
                Filters
              </button>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setView('grid')}
                  className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 ${
                    view === 'grid'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 ${
                    view === 'list'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              {/* Price Range */}
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">
                  Min Price
                </label>
                <input
                  type="number"
                  id="minPrice"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">
                  Max Price
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Rating</label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Any</option>
                  {ratings.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Stars & Up
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort By</label>
                <select
                  value={filters.sort || 'popular'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="mt-8 flex justify-center">
              <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
            </div>
          ) : (
            <div
              className={`mt-8 grid gap-6 ${
                view === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {hotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} />
              ))}
            </div>
          )}

          {!isLoading && hotels.length === 0 && (
            <div className="mt-8 text-center text-gray-500">No hotels found matching your criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
}
