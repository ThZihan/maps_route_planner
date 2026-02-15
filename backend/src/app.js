require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeSocket } = require('./socket/socketHandler');
const logger = require('./utils/logger');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));
app.use(cors());
// Parse URL-encoded query parameters
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes - must come before static files to avoid conflicts
app.use('/api', routes);

// Static files - serve after API routes
app.use(express.static(path.join(__dirname, '../../frontend')));

// Socket.io initialization
initializeSocket(io);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`OSRM URL: ${process.env.OSRM_URL}`);
  logger.info(`Nominatim URL: ${process.env.NOMINATIM_URL}`);
  logger.info(`CORS Origin: ${process.env.CORS_ORIGIN}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
