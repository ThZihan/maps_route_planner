/**
 * Camera Controller for Third-Person 3D View
 * Implements a third-person action game style camera that follows the vehicle
 */

class CameraController3D {
    /**
     * Create a camera controller
     * @param {Object} map - Mapbox map instance
     * @param {Object} options - Camera options
     */
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            pitch: options.pitch || 45,              // Camera tilt (0-85)
            distance: options.distance || 150,       // Distance behind vehicle in meters
            heightOffset: options.heightOffset || 30, // Height above vehicle
            smoothingFactor: options.smoothingFactor || 0.15,
            bearingSmoothing: options.bearingSmoothing || 0.1,
            ...options
        };
        
        // Current camera state
        this.currentPosition = null;      // Current camera position [lng, lat]
        this.currentAltitude = 0;         // Current camera altitude in meters
        this.currentBearing = 0;          // Current camera bearing
        this.currentTarget = null;        // Current look-at target [lng, lat]
        
        // Target state (for smooth interpolation)
        this.targetPosition = null;
        this.targetAltitude = 0;
        this.targetBearing = 0;
        
        // Animation state
        this.isAnimating = false;
        this.animationFrame = null;
        
        // Bind methods
        this._animate = this._animate.bind(this);
    }
    
    /**
     * Update camera to follow vehicle
     * @param {Array} vehicleLngLat - Vehicle position [longitude, latitude]
     * @param {number} vehicleBearing - Vehicle heading in degrees (0 = North)
     * @param {boolean} immediate - Skip smoothing, jump immediately
     */
    update(vehicleLngLat, vehicleBearing, immediate = false) {
        // Calculate camera position behind vehicle
        const cameraPosition = this._calculateCameraPosition(
            vehicleLngLat,
            vehicleBearing,
            this.options.distance,
            this.options.pitch
        );
        
        // Set target for interpolation
        this.targetPosition = cameraPosition.position;
        this.targetAltitude = cameraPosition.altitude;
        this.targetBearing = vehicleBearing;
        this.currentTarget = vehicleLngLat;
        
        if (immediate || !this.currentPosition) {
            // Jump immediately
            this.currentPosition = [...this.targetPosition];
            this.currentAltitude = this.targetAltitude;
            this.currentBearing = this.targetBearing;
            this._applyCamera();
        } else {
            // Start smooth animation if not already running
            if (!this.isAnimating) {
                this.isAnimating = true;
                this._animate();
            }
        }
    }
    
    /**
     * Calculate camera position behind vehicle
     * @private
     */
    _calculateCameraPosition(vehicleLngLat, vehicleBearing, distance, pitch) {
        // Convert bearing to radians (bearing is clockwise from North)
        const bearingRad = (vehicleBearing * Math.PI) / 180;
        
        // Calculate offset in meters
        // Camera is behind the vehicle, so we reverse the bearing
        const offsetNorth = -distance * Math.cos(bearingRad);
        const offsetEast = -distance * Math.sin(bearingRad);
        
        // Convert meters to degrees (approximate)
        // 1 degree latitude ≈ 111,000 meters
        // 1 degree longitude varies with latitude
        const latRad = (vehicleLngLat[1] * Math.PI) / 180;
        const metersPerDegLat = 111000;
        const metersPerDegLng = 111000 * Math.cos(latRad);
        
        const offsetLat = offsetNorth / metersPerDegLat;
        const offsetLng = offsetEast / metersPerDegLng;
        
        // Camera position
        const cameraLng = vehicleLngLat[0] + offsetLng;
        const cameraLat = vehicleLngLat[1] + offsetLat;
        
        // Calculate altitude based on pitch and distance
        // Higher pitch = camera looks more down = lower altitude
        const pitchRad = (pitch * Math.PI) / 180;
        const altitude = distance * Math.tan(pitchRad) + this.options.heightOffset;
        
        return {
            position: [cameraLng, cameraLat],
            altitude: altitude
        };
    }
    
    /**
     * Animation loop for smooth camera following
     * @private
     */
    _animate() {
        if (!this.isAnimating) return;
        
        const smoothing = this.options.smoothingFactor;
        const bearingSmoothing = this.options.bearingSmoothing;
        
        // Smooth interpolation for position
        this.currentPosition[0] += (this.targetPosition[0] - this.currentPosition[0]) * smoothing;
        this.currentPosition[1] += (this.targetPosition[1] - this.currentPosition[1]) * smoothing;
        
        // Smooth interpolation for altitude
        this.currentAltitude += (this.targetAltitude - this.currentAltitude) * smoothing;
        
        // Interpolate bearing (handle wrap-around)
        let bearingDiff = this.targetBearing - this.currentBearing;
        if (bearingDiff > 180) bearingDiff -= 360;
        if (bearingDiff < -180) bearingDiff += 360;
        this.currentBearing += bearingDiff * bearingSmoothing;
        
        // Normalize bearing
        if (this.currentBearing < 0) this.currentBearing += 360;
        if (this.currentBearing >= 360) this.currentBearing -= 360;
        
        // Apply camera
        this._applyCamera();
        
        // Check if we've reached the target
        const positionDelta = Math.sqrt(
            Math.pow(this.targetPosition[0] - this.currentPosition[0], 2) +
            Math.pow(this.targetPosition[1] - this.currentPosition[1], 2)
        );
        
        if (positionDelta < 0.00001) {
            // Close enough, stop animation
            this.isAnimating = false;
        } else {
            // Continue animation
            this.animationFrame = requestAnimationFrame(this._animate);
        }
    }
    
    /**
     * Apply camera settings to map
     * @private
     */
    _applyCamera() {
        if (!this.map || !this.currentPosition) return;
        
        try {
            const camera = this.map.getFreeCameraOptions();
            
            // Set camera position in Mercator coordinates
            camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
                this.currentPosition,
                this.currentAltitude
            );
            
            // Look at the vehicle
            camera.lookAtPoint(this.currentTarget);
            
            // Apply to map
            this.map.setFreeCameraOptions(camera);
        } catch (error) {
            console.warn('[CameraController3D] Error applying camera:', error);
        }
    }
    
    /**
     * Set camera pitch
     * @param {number} pitch - Pitch angle (0-85 degrees)
     */
    setPitch(pitch) {
        this.options.pitch = Math.max(0, Math.min(85, pitch));
    }
    
    /**
     * Set camera distance
     * @param {number} distance - Distance behind vehicle in meters
     */
    setDistance(distance) {
        this.options.distance = Math.max(10, Math.min(1000, distance));
    }
    
    /**
     * Set smoothing factor
     * @param {number} factor - Smoothing factor (0-1, lower = smoother)
     */
    setSmoothing(factor) {
        this.options.smoothingFactor = Math.max(0.01, Math.min(1, factor));
    }
    
    /**
     * Get current camera state
     * @returns {Object} Camera state
     */
    getState() {
        return {
            position: this.currentPosition ? [...this.currentPosition] : null,
            altitude: this.currentAltitude,
            bearing: this.currentBearing,
            target: this.currentTarget ? [...this.currentTarget] : null,
            pitch: this.options.pitch,
            distance: this.options.distance
        };
    }
    
    /**
     * Reset camera to default view (top-down)
     */
    reset() {
        this.stopAnimation();
        
        this.currentPosition = null;
        this.currentAltitude = 0;
        this.currentBearing = 0;
        this.currentTarget = null;
        
        // Reset map to default view
        if (this.map) {
            this.map.easeTo({
                pitch: 0,
                bearing: 0,
                zoom: 12
            });
        }
    }
    
    /**
     * Stop any ongoing animation
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    /**
     * Fly to a position with animation
     * @param {Array} lngLat - Target [longitude, latitude]
     * @param {Object} options - Fly options
     */
    flyTo(lngLat, options = {}) {
        this.stopAnimation();
        
        const duration = options.duration || 2000;
        const zoom = options.zoom || 15;
        const pitch = options.pitch || this.options.pitch;
        
        this.map.flyTo({
            center: lngLat,
            zoom: zoom,
            pitch: pitch,
            bearing: options.bearing || 0,
            duration: duration,
            essential: true
        });
    }
    
    /**
     * Start 3D follow mode with transition
     * @param {Array} vehicleLngLat - Initial vehicle position
     * @param {number} vehicleBearing - Initial vehicle bearing
     */
    startFollowMode(vehicleLngLat, vehicleBearing) {
        // First, fly to the vehicle position
        this.map.flyTo({
            center: vehicleLngLat,
            zoom: 16,
            pitch: this.options.pitch,
            bearing: vehicleBearing,
            duration: 2000,
            essential: true
        });
        
        // After fly animation, start smooth following
        setTimeout(() => {
            // Initialize camera position
            const cameraPos = this._calculateCameraPosition(
                vehicleLngLat,
                vehicleBearing,
                this.options.distance,
                this.options.pitch
            );
            
            this.currentPosition = [...cameraPos.position];
            this.currentAltitude = cameraPos.altitude;
            this.currentBearing = vehicleBearing;
            this.currentTarget = [...vehicleLngLat];
        }, 2000);
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopAnimation();
        this.map = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CameraController3D };
} else {
    window.CameraController3D = CameraController3D;
}
