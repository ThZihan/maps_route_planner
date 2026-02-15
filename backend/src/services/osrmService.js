const axios = require('axios');
const OSRM_URL = process.env.OSRM_URL || 'http://localhost:5000';
const logger = require('../utils/logger');

class OSRMService {
  async getRoute(start, end) {
    try {
      const response = await axios.get(`${OSRM_URL}/route/v1/driving/${start};${end}`, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true
        },
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('OSRM Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDistance(start, end) {
    try {
      const response = await axios.get(`${OSRM_URL}/route/v1/driving/${start};${end}`, {
        params: {
          overview: false
        },
        timeout: 10000
      });

      return response.data.routes[0];
    } catch (error) {
      logger.error('OSRM Distance Error:', error.message);
      throw error;
    }
  }
}

module.exports = new OSRMService();
