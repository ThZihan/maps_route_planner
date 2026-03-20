const osrmService = require('../services/osrmService');
const nominatimService = require('../services/nominatimService');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

exports.calculateRoute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { start, end } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end coordinates required' });
    }

    const result = await osrmService.getRoute(start, end);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const route = result.data.routes[0];
    
    res.json({
      success: true,
      route: {
        geometry: route.geometry,
        distance: route.distance, // meters
        duration: route.duration, // seconds
        legs: route.legs
      }
    });
  } catch (error) {
    logger.error('Route calculation error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.searchLocation = async (req, res) => {
  try {
    const query = req.query.q;
    
    logger.info(`Search request received - Query: "${query}", URL: ${req.url}, Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    logger.info(`Request headers:`, JSON.stringify(req.headers));
    logger.info(`Query object:`, JSON.stringify(req.query));
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const result = await nominatimService.search(query);

    if (!result.success) {
      return res.status(result.initializing ? 503 : 500).json({ 
        error: result.error,
        initializing: result.initializing
      });
    }

    res.json({
      success: true,
      locations: result.data.map(loc => ({
        lat: parseFloat(loc.lat),
        lon: parseFloat(loc.lon),
        display_name: loc.display_name,
        address: loc.address
      }))
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.calculateETA = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { distance, speed } = req.body;

    if (!distance || !speed) {
      return res.status(400).json({ error: 'Distance and speed required' });
    }

    // time = distance / (speed / 3.6)
    const timeSeconds = distance / (speed / 3.6);
    const timeMinutes = Math.round(timeSeconds / 60);
    const remainingSeconds = Math.round(timeSeconds % 60);

    logger.info(`[ETA Debug] distance: ${distance}m, speed: ${speed}km/h, timeSeconds: ${timeSeconds}, timeMinutes: ${timeMinutes}, remainingSeconds: ${remainingSeconds}`);

    // Format: Always show seconds for precision
    // "Xh Ym Zs" or "Ym Zs" or "Zs"
    let formatted = '';
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    
    if (hours > 0) {
      formatted += `${hours}h `;
    }
    if (minutes > 0) {
      formatted += `${minutes}m `;
    }
    formatted += `${remainingSeconds}s`;

    logger.info(`[ETA Debug] formatted ETA: "${formatted}"`);

    res.json({
      success: true,
      eta: {
        seconds: timeSeconds,
        minutes: timeMinutes,
        formatted: formatted.trim()
      }
    });
  } catch (error) {
    logger.error('ETA calculation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Store vehicle position in memory (for demo purposes)
let vehiclePosition = {
  lat: null,
  lng: null,
  timestamp: null,
  heading: null
};

exports.getVehiclePosition = (req, res) => {
  try {
    res.json({
      success: true,
      position: vehiclePosition
    });
  } catch (error) {
    logger.error('Get vehicle position error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateVehiclePosition = (req, res) => {
  try {
    const { lat, lng, heading } = req.body;
    
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    vehiclePosition = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      heading: heading ? parseFloat(heading) : null,
      timestamp: new Date().toISOString()
    };
    
    logger.info(`Vehicle position updated: ${vehiclePosition.lat}, ${vehiclePosition.lng}`);
    
    // Emit to connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('vehiclePosition', vehiclePosition);
    }
    
    res.json({
      success: true,
      position: vehiclePosition
    });
  } catch (error) {
    logger.error('Update vehicle position error:', error);
    res.status(500).json({ error: error.message });
  }
};
