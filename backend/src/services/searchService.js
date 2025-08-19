const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const axios = require('axios');

// Google Maps API service for location-based searches
class LocationService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // Get coordinates from address/place name
  async geocode(address) {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
          addressComponents: result.address_components,
        };
      }

      throw new Error('Location not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  // Get place details by place ID
  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,types,address_components',
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK') {
        return response.data.result;
      }

      throw new Error('Place details not found');
    } catch (error) {
      console.error('Place details error:', error);
      throw new Error('Failed to get place details');
    }
  }

  // Search for places by text
  async searchPlaces(query, type = 'establishment') {
    try {
      const response = await axios.get(`${this.baseUrl}/place/textsearch/json`, {
        params: {
          query,
          type,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK') {
        return response.data.results.map((place) => ({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          types: place.types,
        }));
      }

      return [];
    } catch (error) {
      console.error('Place search error:', error);
      return [];
    }
  }

  // Calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

// Hotel search service
class HotelSearchService {
  constructor() {
    this.locationService = new LocationService();
  }

  // Main search function
  async searchHotels(searchParams) {
    const {
      destination,
      checkIn,
      checkOut,
      adults = 1,
      children = 0,
      infants = 0,
      rooms = 1,
      latitude,
      longitude,
      radius = 50, // km
      minPrice,
      maxPrice,
      starRating,
      amenities,
      category,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
    } = searchParams;

    let query = {
      status: 'approved',
      isActive: true,
    };

    // Location-based search
    let coordinates = null;
    
    if (latitude && longitude) {
      coordinates = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
    } else if (destination) {
      try {
        coordinates = await this.locationService.geocode(destination);
      } catch (error) {
        // Fall back to text search if geocoding fails
        query.$or = [
          { name: new RegExp(destination, 'i') },
          { 'location.city': new RegExp(destination, 'i') },
          { 'location.state': new RegExp(destination, 'i') },
          { 'location.country': new RegExp(destination, 'i') },
          { 'location.address': new RegExp(destination, 'i') },
        ];
      }
    }

    // Add geospatial query if coordinates are available
    if (coordinates) {
      const radiusInRadians = radius / 6371; // Convert km to radians
      query['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [[coordinates.longitude, coordinates.latitude], radiusInRadians],
        },
      };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query['priceRange.min'] = {};
      if (minPrice) {
        query['priceRange.min']['$gte'] = parseFloat(minPrice);
      }
      if (maxPrice) {
        query['priceRange.max'] = { $lte: parseFloat(maxPrice) };
      }
    }

    // Filter by star rating
    if (starRating) {
      query.starRating = { $gte: parseInt(starRating) };
    }

    // Filter by amenities
    if (amenities && amenities.length > 0) {
      query.amenities = { $in: Array.isArray(amenities) ? amenities : [amenities] };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Pagination
    const startIndex = (page - 1) * limit;

    // Build sort query
    let sortQuery = {};
    switch (sortBy) {
      case 'price-low':
        sortQuery = { 'priceRange.min': 1 };
        break;
      case 'price-high':
        sortQuery = { 'priceRange.min': -1 };
        break;
      case 'rating':
        sortQuery = { averageRating: -1 };
        break;
      case 'popularity':
        sortQuery = { popularityScore: -1 };
        break;
      case 'distance':
        if (coordinates) {
          // This would require adding distance calculation in aggregation
          sortQuery = { 'location.coordinates': 1 };
        } else {
          sortQuery = { popularityScore: -1 };
        }
        break;
      default:
        sortQuery = { featured: -1, popularityScore: -1, averageRating: -1 };
    }

    // Execute search
    let hotels = await Hotel.find(query)
      .select('name description location images category starRating averageRating totalReviews priceRange amenities featured')
      .sort(sortQuery)
      .skip(startIndex)
      .limit(limit)
      .lean();

    // Add distance calculation if coordinates are available
    if (coordinates) {
      hotels = hotels.map((hotel) => {
        const distance = this.locationService.calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          hotel.location.coordinates.latitude,
          hotel.location.coordinates.longitude
        );
        return { ...hotel, distance: Math.round(distance * 10) / 10 };
      });

      // Sort by distance if requested
      if (sortBy === 'distance') {
        hotels.sort((a, b) => a.distance - b.distance);
      }
    }

    // Get total count for pagination
    const total = await Hotel.countDocuments(query);

    // If dates are provided, check room availability
    if (checkIn && checkOut && hotels.length > 0) {
      const hotelIds = hotels.map((hotel) => hotel._id);
      const availableRooms = await this.getAvailableRoomsByHotels(
        hotelIds,
        new Date(checkIn),
        new Date(checkOut),
        adults,
        children,
        infants,
        rooms
      );

      // Filter hotels that have available rooms
      hotels = hotels.filter((hotel) => 
        availableRooms.some((room) => room.hotel.toString() === hotel._id.toString())
      );

      // Add available rooms info to hotels
      hotels = hotels.map((hotel) => {
        const hotelRooms = availableRooms.filter(
          (room) => room.hotel.toString() === hotel._id.toString()
        );
        return {
          ...hotel,
          availableRooms: hotelRooms.length,
          lowestPrice: hotelRooms.length > 0 
            ? Math.min(...hotelRooms.map((room) => room.currentPrice))
            : hotel.priceRange.min,
        };
      });
    }

    return {
      hotels,
      total: hotels.length,
      totalHotels: total,
      page,
      totalPages: Math.ceil(total / limit),
      coordinates,
    };
  }

  // Get available rooms for multiple hotels
  async getAvailableRoomsByHotels(hotelIds, checkIn, checkOut, adults, children, infants, roomsNeeded) {
    const totalGuests = adults + children + infants;
    
    const availableRooms = await Room.aggregate([
      {
        $match: {
          hotel: { $in: hotelIds },
          status: 'active',
          'availability.isAvailable': true,
          'capacity.adults': { $gte: adults },
          'capacity.children': { $gte: children },
          'capacity.infants': { $gte: infants },
        },
      },
      {
        $match: {
          'availability.unavailableDates': {
            $not: {
              $elemMatch: {
                $or: [
                  {
                    startDate: { $lte: checkIn },
                    endDate: { $gt: checkIn },
                  },
                  {
                    startDate: { $lt: checkOut },
                    endDate: { $gte: checkOut },
                  },
                  {
                    startDate: { $gte: checkIn },
                    endDate: { $lte: checkOut },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$hotel',
          rooms: { $push: '$$ROOT' },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gte: roomsNeeded },
        },
      },
      {
        $unwind: '$rooms',
      },
      {
        $replaceRoot: { newRoot: '$rooms' },
      },
    ]);

    return availableRooms;
  }

  // Search suggestions for autocomplete
  async getSearchSuggestions(query, limit = 10) {
    const suggestions = [];

    // City suggestions
    const cities = await Hotel.aggregate([
      {
        $match: {
          status: 'approved',
          isActive: true,
          'location.city': new RegExp(query, 'i'),
        },
      },
      {
        $group: {
          _id: {
            city: '$location.city',
            state: '$location.state',
            country: '$location.country',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit / 2,
      },
    ]);

    suggestions.push(
      ...cities.map((city) => ({
        type: 'city',
        text: `${city._id.city}, ${city._id.state}, ${city._id.country}`,
        value: city._id.city,
        count: city.count,
      }))
    );

    // Hotel name suggestions
    const hotels = await Hotel.find({
      status: 'approved',
      isActive: true,
      name: new RegExp(query, 'i'),
    })
      .select('name location')
      .limit(limit / 2)
      .lean();

    suggestions.push(
      ...hotels.map((hotel) => ({
        type: 'hotel',
        text: hotel.name,
        value: hotel.name,
        subtitle: `${hotel.location.city}, ${hotel.location.country}`,
        hotelId: hotel._id,
      }))
    );

    return suggestions.slice(0, limit);
  }

  // Get popular destinations
  async getPopularDestinations(limit = 10) {
    const destinations = await Hotel.aggregate([
      {
        $match: {
          status: 'approved',
          isActive: true,
        },
      },
      {
        $group: {
          _id: {
            city: '$location.city',
            state: '$location.state',
            country: '$location.country',
          },
          hotelCount: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          totalReviews: { $sum: '$totalReviews' },
          minPrice: { $min: '$priceRange.min' },
        },
      },
      {
        $sort: { hotelCount: -1, totalReviews: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    return destinations.map((dest) => ({
      city: dest._id.city,
      state: dest._id.state,
      country: dest._id.country,
      displayName: `${dest._id.city}, ${dest._id.state}`,
      hotelCount: dest.hotelCount,
      averageRating: Math.round(dest.averageRating * 10) / 10,
      totalReviews: dest.totalReviews,
      startingPrice: dest.minPrice,
    }));
  }

  // Advanced filters for search
  async getSearchFilters(destination) {
    const matchQuery = destination
      ? {
          status: 'approved',
          isActive: true,
          $or: [
            { 'location.city': new RegExp(destination, 'i') },
            { 'location.state': new RegExp(destination, 'i') },
            { 'location.country': new RegExp(destination, 'i') },
          ],
        }
      : { status: 'approved', isActive: true };

    const filters = await Hotel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          categories: { $addToSet: '$category' },
          starRatings: { $addToSet: '$starRating' },
          minPrice: { $min: '$priceRange.min' },
          maxPrice: { $max: '$priceRange.max' },
          amenities: { $push: '$amenities' },
        },
      },
      {
        $project: {
          categories: 1,
          starRatings: { $sortArray: { input: '$starRatings', sortBy: 1 } },
          priceRange: {
            min: '$minPrice',
            max: '$maxPrice',
          },
          amenities: {
            $reduce: {
              input: '$amenities',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] },
            },
          },
        },
      },
    ]);

    return filters[0] || {
      categories: [],
      starRatings: [],
      priceRange: { min: 0, max: 1000 },
      amenities: [],
    };
  }
}

// Export the search service
const hotelSearchService = new HotelSearchService();

module.exports = {
  HotelSearchService,
  LocationService,
  hotelSearchService,
};
