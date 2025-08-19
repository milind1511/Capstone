import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = {
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      location: searchParams.location,
      guests: searchParams.guests.toString()
    };
    const queryString = new URLSearchParams(params).toString();
    navigate(`/hotels?${queryString}`);
  };

  return (
    <div className="relative">
      {/* Hero section */}
      <div className="relative h-[600px]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
            alt="Hotel exterior"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-500 mix-blend-multiply" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find your perfect stay
          </h1>
          <p className="mt-6 max-w-3xl text-xl text-gray-100">
            Discover and book the best hotels for your next adventure. Whether you're traveling for
            business or leisure, we've got you covered.
          </p>

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className="mt-8 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:p-6 lg:mt-12"
          >
            <div className="flex-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Where are you going?"
                  value={searchParams.location}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, location: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="check-in" className="block text-sm font-medium text-gray-700">
                Check-in
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="check-in"
                  id="check-in"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={searchParams.checkIn}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, checkIn: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="check-out" className="block text-sm font-medium text-gray-700">
                Check-out
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="check-out"
                  id="check-out"
                  required
                  min={searchParams.checkIn || new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={searchParams.checkOut}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, checkOut: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
                Guests
              </label>
              <div className="mt-1">
                <select
                  id="guests"
                  name="guests"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={searchParams.guests}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, guests: Number(e.target.value) }))
                  }
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:mt-6">
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-8"
              >
                <MagnifyingGlassIcon className="mr-2 h-5 w-5" />
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Featured Sections */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Popular Destinations</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {['New York', 'Paris', 'Tokyo'].map((city) => (
            <div
              key={city}
              className="group relative cursor-pointer overflow-hidden rounded-lg"
              onClick={() => {
                setSearchParams((prev) => ({ ...prev, location: city }));
                const queryString = new URLSearchParams({
                  location: city,
                }).toString();
                navigate(`/hotels?${queryString}`);
              }}
            >
              <div className="aspect-h-1 aspect-w-1 h-80 w-full overflow-hidden">
                <img
                  src={`https://source.unsplash.com/featured/?${city},hotel`}
                  alt={city}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 p-6">
                <h3 className="text-xl font-semibold text-white">{city}</h3>
                <p className="mt-1 text-sm text-gray-300">Explore hotels in {city}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
