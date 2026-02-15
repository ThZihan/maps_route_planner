const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { body } = require('express-validator');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Route endpoints
router.post('/route', 
  [
    body('start').notEmpty().withMessage('Start coordinates required'),
    body('end').notEmpty().withMessage('End coordinates required')
  ],
  routeController.calculateRoute
);

router.get('/search', routeController.searchLocation);

router.post('/eta',
  [
    body('distance').isNumeric().withMessage('Distance must be a number'),
    body('speed').isNumeric().withMessage('Speed must be a number')
  ],
  routeController.calculateETA
);

module.exports = router;
