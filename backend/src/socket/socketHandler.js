const logger = require('../utils/logger');

function initializeSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join room for route updates
    socket.on('join-route', (routeId) => {
      socket.join(`route-${routeId}`);
      logger.info(`Socket ${socket.id} joined route ${routeId}`);
    });

    // Handle vehicle position updates (for Phase 3)
    socket.on('update-position', (data) => {
      socket.to(`route-${data.routeId}`).emit('position-update', data);
    });

    // Handle animation control events
    socket.on('animation-play', (data) => {
      socket.to(`route-${data.routeId}`).emit('animation-play', data);
    });

    socket.on('animation-pause', (data) => {
      socket.to(`route-${data.routeId}`).emit('animation-pause', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initializeSocket };
