/**
 * 3D Animation Engine
 * Handles vehicle animation along route with third-person camera following
 */

class AnimationEngine3D {
    /**
     * Create 3D animation engine
     * @param {Object} map - Mapbox map instance
     * @param {Object} vehicleMarker - VehicleMarker3D instance
     * @param {Object} cameraController - CameraController3D instance
     */
    constructor(map, vehicleMarker, cameraController) {
        this.map = map;
        this.vehicleMarker = vehicleMarker;
        this.cameraController = cameraController;
        
        // Animation state
        this.isPlaying = false;
        this.progress = 0;          // 0-100
        this.animationSpeed = 1;    // Multiplier
        this.routeDuration = 60000; // Total duration in ms (will be set from route)
        
        // Route data
        this.routeCoordinates = []; // [[lng, lat], ...]
        this.currentSegment = 0;
        
        // Timing
        this.startTime = 0;
        this.elapsedTime = 0;
        this.lastFrameTime = 0;
        
        // Frame management
        this.animationFrame = null;
        this.frameInterval = 1000 / 60; // Target 60fps
        this.accumulatedTime = 0;
        this.positionUpdateTimeout = null;
        
        // Performance optimization
        this.frameSkipCount = 0;
        this.maxFrameSkips = 5;
        
        // Bind methods
        this._animate = this._animate.bind(this);
        this._updateVehicleAlongRoute = this._updateVehicleAlongRoute.bind(this);
    }
    
    /**
     * Set route data for animation
     * @param {Array} coordinates - Route coordinates [[lng, lat], ...]
     * @param {number} duration - Animation duration in seconds
     */
    setRoute(coordinates, duration) {
        this.routeCoordinates = coordinates;
        this.routeDuration = (duration || 60) * 1000; // Convert to ms
        this.progress = 0;
        this.currentSegment = 0;
        
        // Update coordinates display with start position
        if (coordinates.length > 0) {
            const startPos = coordinates[0];
            this._updateCoordinatesDisplay(startPos[1], startPos[0]);
        }
        
        console.log(`[AnimationEngine3D] Route set: ${coordinates.length} points, ${duration}s duration`);
    }
    
    /**
     * Start animation
     */
    play() {
        console.log('[AnimationEngine3D] play() called, isPlaying:', this.isPlaying, 'routeLength:', this.routeCoordinates.length);
        
        if (this.isPlaying) {
            console.log('[AnimationEngine3D] Already playing, returning');
            return;
        }
        
        if (this.routeCoordinates.length < 2) {
            console.warn('[AnimationEngine3D] No route to animate. Route coordinates:', this.routeCoordinates.length);
            return;
        }
        
        this.isPlaying = true;
        this.startTime = performance.now() - this.elapsedTime;
        this.lastFrameTime = performance.now();
        
        // Start camera follow mode
        const startPos = this.routeCoordinates[0];
        const startBearing = this._calculateBearing(0);
        console.log('[AnimationEngine3D] Starting camera follow mode at:', startPos, 'bearing:', startBearing);
        this.cameraController.startFollowMode(startPos, startBearing);
        
        // Start animation loop after camera transition
        setTimeout(() => {
            if (this.isPlaying) {
                console.log('[AnimationEngine3D] Starting animation loop');
                // Use requestAnimationFrame to get proper timestamp
                this.animationFrame = requestAnimationFrame(this._animate);
            }
        }, 2000);
        
        console.log('[AnimationEngine3D] Animation started');
    }
    
    /**
     * Pause animation
     */
    pause() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.cameraController.stopAnimation();
        
        console.log('[AnimationEngine3D] Animation paused');
    }
    
    /**
     * Reset animation to start
     */
    reset() {
        this.pause();
        this.progress = 0;
        this.elapsedTime = 0;
        this.currentSegment = 0;
        
        // Reset vehicle to start position
        if (this.routeCoordinates.length > 0) {
            const startPos = this.routeCoordinates[0];
            const bearing = this._calculateBearing(0);
            this.vehicleMarker.setPosition(startPos, bearing);
            
            // Update coordinates display with start position
            this._updateCoordinatesDisplay(startPos[1], startPos[0]);
        }
        
        // Reset camera
        this.cameraController.reset();
        
        // Update UI
        this._updateProgressUI();
        
        console.log('[AnimationEngine3D] Animation reset');
    }
    
    /**
     * Set animation speed
     * @param {number} speed - Speed multiplier (1 = normal)
     */
    setSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(10, speed));
        
        // Recalculate start time to maintain current progress
        if (this.isPlaying) {
            this.startTime = performance.now() - (this.elapsedTime / this.animationSpeed);
        }
    }
    
    /**
     * Set progress directly
     * @param {number} progress - Progress percentage (0-100)
     */
    setProgress(progress) {
        this.progress = Math.max(0, Math.min(100, progress));
        this.elapsedTime = (this.progress / 100) * (this.routeDuration / this.animationSpeed);
        
        if (this.isPlaying) {
            this.startTime = performance.now() - this.elapsedTime;
        }
        
        this._updateVehicleAlongRoute();
    }
    
    /**
     * Main animation loop
     * @private
     */
    _animate(currentTime) {
        if (!this.isPlaying) {
            console.log('[AnimationEngine3D] _animate called but not playing');
            return;
        }
        
        // Initialize lastFrameTime on first call
        if (!this.lastFrameTime || this.lastFrameTime === 0) {
            this.lastFrameTime = currentTime;
        }
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        console.log('[AnimationEngine3D] _animate: deltaTime=', deltaTime, 'progress=', this.progress);
        
        // Accumulate time for fixed timestep updates
        this.accumulatedTime += deltaTime;
        
        // Fixed timestep updates (prevents spiral of death on slow devices)
        let framesUpdated = 0;
        while (this.accumulatedTime >= this.frameInterval && framesUpdated < this.maxFrameSkips) {
            this._update(this.frameInterval);
            this.accumulatedTime -= this.frameInterval;
            framesUpdated++;
        }
        
        // Always render (interpolate if needed)
        this._render();
        
        // Continue animation if still playing
        if (this.isPlaying && this.progress < 100) {
            this.animationFrame = requestAnimationFrame(this._animate);
        } else if (this.progress >= 100) {
            this._onAnimationComplete();
        }
    }
    
    /**
     * Update animation state
     * @private
     */
    _update(deltaTime) {
        // Update elapsed time with speed multiplier
        this.elapsedTime += deltaTime * this.animationSpeed;
        
        // Calculate progress
        this.progress = (this.elapsedTime / this.routeDuration) * 100;
        
        if (this.progress >= 100) {
            this.progress = 100;
        }
    }
    
    /**
     * Render current frame
     * @private
     */
    _render() {
        this._updateVehicleAlongRoute();
        this._updateProgressUI();
    }
    
    /**
     * Update vehicle position along route
     * @private
     */
    _updateVehicleAlongRoute() {
        if (this.routeCoordinates.length < 2) return;
        
        const totalPoints = this.routeCoordinates.length;
        
        // Calculate current position along route
        const routeProgress = this.progress / 100;
        const totalSegments = totalPoints - 1;
        
        // Find current segment
        const exactSegment = routeProgress * totalSegments;
        const currentSegment = Math.floor(exactSegment);
        const nextSegment = Math.min(currentSegment + 1, totalPoints - 1);
        
        // Interpolation within segment
        const segmentProgress = exactSegment - currentSegment;
        
        // Get segment coordinates
        const currentPoint = this.routeCoordinates[currentSegment];
        const nextPoint = this.routeCoordinates[nextSegment];
        
        // Interpolate position
        const lng = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress;
        const lat = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress;
        
        // Calculate bearing (heading)
        const bearing = this._calculateBearing(routeProgress);
        
        // Update vehicle marker
        this.vehicleMarker.setPosition([lng, lat], bearing);
        
        // Update camera to follow vehicle
        this.cameraController.update([lng, lat], bearing);
        
        // Update coordinates display
        this._updateCoordinatesDisplay(lat, lng);
        
        // Send position update to backend
        this._sendPositionToBackend(lat, lng, bearing);
    }
    
    /**
     * Calculate bearing at current progress
     * @private
     */
    _calculateBearing(routeProgress) {
        if (this.routeCoordinates.length < 2) return 0;
        
        const totalSegments = this.routeCoordinates.length - 1;
        const exactSegment = routeProgress * totalSegments;
        const currentSegment = Math.floor(exactSegment);
        const nextSegment = Math.min(currentSegment + 1, this.routeCoordinates.length - 1);
        
        const current = this.routeCoordinates[currentSegment];
        const next = this.routeCoordinates[nextSegment];
        
        // Calculate bearing between two points
        const dLng = next[0] - current[0];
        const dLat = next[1] - current[1];
        
        // Bearing in degrees (0 = North, clockwise)
        const bearing = Math.atan2(dLng, dLat) * (180 / Math.PI);
        
        // Normalize to 0-360
        return (bearing + 360) % 360;
    }
    
    /**
     * Update progress UI elements
     * @private
     */
    _updateProgressUI() {
        // Update progress display
        const progressDisplay = document.getElementById('progress-percent');
        if (progressDisplay) {
            progressDisplay.textContent = Math.round(this.progress);
        }
        
        // Update time elapsed display
        const timeDisplay = document.getElementById('time-elapsed');
        if (timeDisplay) {
            const seconds = Math.floor(this.elapsedTime / 1000);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timeDisplay.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Handle animation complete
     * @private
     */
    _onAnimationComplete() {
        this.isPlaying = false;
        console.log('[AnimationEngine3D] Animation complete');
        
        // Dispatch completion event
        window.dispatchEvent(new CustomEvent('animation3dComplete'));
    }
    
    /**
     * Update coordinates display in UI
     * @private
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    _updateCoordinatesDisplay(lat, lng) {
        const latElement = document.getElementById('current-lat');
        const lngElement = document.getElementById('current-lng');
        
        if (latElement) {
            latElement.textContent = `Lat: ${lat.toFixed(6)}`;
        }
        if (lngElement) {
            lngElement.textContent = `Lng: ${lng.toFixed(6)}`;
        }
    }
    
    /**
     * Send position update to backend
     * @private
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} heading - Heading in degrees
     */
    _sendPositionToBackend(lat, lng, heading) {
        // Debounce position updates to avoid overwhelming the server
        if (this.positionUpdateTimeout) {
            clearTimeout(this.positionUpdateTimeout);
        }
        
        this.positionUpdateTimeout = setTimeout(() => {
            fetch('/api/vehicle/position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng, heading })
            }).catch(error => {
                console.error('[AnimationEngine3D] Failed to send position update:', error);
            });
        }, 100); // Send updates at most every 100ms
    }
    
    /**
     * Get current animation state
     * @returns {Object} Animation state
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            progress: this.progress,
            speed: this.animationSpeed,
            elapsedTime: this.elapsedTime,
            duration: this.routeDuration,
            coordinates: this.routeCoordinates.length
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.pause();
        this.routeCoordinates = [];
        this.map = null;
        this.vehicleMarker = null;
        this.cameraController = null;
    }
}

// Factory function
function createAnimationEngine3D(map, vehicleMarker, cameraController) {
    return new AnimationEngine3D(map, vehicleMarker, cameraController);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnimationEngine3D, createAnimationEngine3D };
} else {
    window.AnimationEngine3D = AnimationEngine3D;
    window.createAnimationEngine3D = createAnimationEngine3D;
}
