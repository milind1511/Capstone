import { Link } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/20/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { Hotel } from '../../features/hotels/hotelsSlice';

interface HotelCardProps {
  hotel: Hotel;
}

export default function HotelCard({ hotel }: HotelCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="aspect-h-2 aspect-w-3 relative overflow-hidden">
        <img
          src={hotel.images[0]}
          alt={hotel.name}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center space-x-1">
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-white">{hotel.rating}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-xl font-semibold text-gray-900">{hotel.name}</h3>
        
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <MapPinIcon className="mr-1 h-4 w-4 flex-shrink-0" />
          <span>
            {hotel.location.city}, {hotel.location.country}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-600">{hotel.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            From{' '}
            <span className="text-lg font-semibold text-gray-900">${hotel.priceRange.min}</span>
            /night
          </div>
          <Link
            to={`/hotels/${hotel._id}`}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
