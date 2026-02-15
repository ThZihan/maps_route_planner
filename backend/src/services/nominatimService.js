const axios = require('axios');
const NOMINATIM_URL = process.env.NOMINATIM_URL || 'http://localhost:8080';
const logger = require('../utils/logger');

// Simple in-memory cache for search results
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class NominatimService {
  async search(query) {
    try {
      // Check cache first
      const cacheKey = query.toLowerCase().trim();
      if (searchCache.has(cacheKey)) {
        const cached = searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          logger.info(`Cache hit for query: "${query}"`);
          return cached.data;
        }
      }

      const response = await axios.get(`${NOMINATIM_URL}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 5,
          addressdetails: 1,
          countrycodes: 'bd'
        },
        timeout: 5000  // Reduced from 10s to 5s for faster feedback
      });

      return {
        success: true,
        data: response.data
      };
      
      // Cache the successful result
      searchCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      logger.info(`Cached result for query: "${query}"`);
    } catch (error) {
      logger.error('Nominatim Error:', error.message);
      
      // Check if Nominatim is still initializing
      if (error.response?.status === 503 || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Geocoding service is initializing. Please try again later.',
          initializing: true
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async reverse(lat, lon) {
    try {
      const response = await axios.get(`${NOMINATIM_URL}/reverse`, {
        params: {
          lat,
          lon,
          format: 'json'
        },
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Nominatim Reverse Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NominatimService();
