/**
 * 3D Vehicle Marker for Mapbox GL JS
 * Creates a custom vehicle marker with rotation based on heading
 */

class VehicleMarker3D {
    /**
     * Create a 3D vehicle marker
     * @param {Object} map - Mapbox map instance
     * @param {Object} options - Marker options
     */
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            size: options.size || 40,
            color: options.color || '#3b82f6',
            glowColor: options.glowColor || '#22d3ee',
            showGlow: options.showGlow !== false,
            showShadow: options.showShadow !== false,
            ...options
        };
        
        this.marker = null;
        this.element = null;
        this.currentPosition = null;
        this.currentHeading = 0;
        this.isVisible = false;
    }
    
    /**
     * Initialize the marker
     * @returns {VehicleMarker3D} this instance for chaining
     */
    initialize() {
        // Create custom HTML element for the marker
        this.element = this._createMarkerElement();
        
        // Create Mapbox marker
        this.marker = new mapboxgl.Marker({
            element: this.element,
            anchor: 'center',
            offset: [0, 0]
        });
        
        return this;
    }
    
    /**
     * Create the marker DOM element
     * @private
     */
    _createMarkerElement() {
        const container = document.createElement('div');
        container.className = 'vehicle-marker-3d';
        container.style.width = `${this.options.size}px`;
        container.style.height = `${this.options.size}px`;
        
        const inner = document.createElement('div');
        inner.className = 'vehicle-marker-3d-inner';
        
        // Add glow ring if enabled
        if (this.options.showGlow) {
            const glowRing = document.createElement('div');
            glowRing.className = 'vehicle-glow-ring';
            glowRing.style.borderColor = `${this.options.glowColor}80`;
            inner.appendChild(glowRing);
        }
        
        // Add vehicle icon (arrow pointing up)
        const svg = this._createVehicleSVG();
        inner.appendChild(svg);
        
        // Add shadow if enabled
        if (this.options.showShadow) {
            const shadow = document.createElement('div');
            shadow.className = 'vehicle-shadow';
            inner.appendChild(shadow);
        }
        
        container.appendChild(inner);
        return container;
    }
    
    /**
     * Create vehicle SVG icon
     * @private
     */
    _createVehicleSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.style.width = '32px';
        svg.style.height = '32px';
        svg.style.transition = 'transform 0.1s ease-out';
        
        // Vehicle body (arrow/navigator icon)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12 2L4 20h16L12 2z');
        path.setAttribute('fill', this.options.color);
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '1.5');
        
        // Inner highlight
        const innerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        innerPath.setAttribute('d', 'M12 6L8 16h8L12 6z');
        innerPath.setAttribute('fill', 'white');
        innerPath.setAttribute('opacity', '0.3');
        
        svg.appendChild(path);
        svg.appendChild(innerPath);
        
        return svg;
    }
    
    /**
     * Set marker position
     * @param {Array} lngLat - [longitude, latitude]
     * @param {number} heading - Heading in degrees (0 = North)
     */
    setPosition(lngLat, heading = 0) {
        if (!this.marker) {
            this.initialize();
        }
        
        this.currentPosition = lngLat;
        this.currentHeading = heading;
        
        // Update marker position
        this.marker.setLngLat(lngLat);
        
        // Update rotation
        this._updateRotation(heading);
        
        // Show marker if not visible
        if (!this.isVisible) {
            this.show();
        }
    }
    
    /**
     * Update marker rotation based on heading
     * @private
     */
    _updateRotation(heading) {
        if (!this.element) return;
        
        const svg = this.element.querySelector('svg');
        if (svg) {
            // Rotate the SVG to point in the direction of travel
            // Mapbox bearing is clockwise from North, CSS rotation is clockwise from East
            // We need to adjust: heading is from North, SVG arrow points up (North)
            svg.style.transform = `rotate(${heading}deg)`;
        }
    }
    
    /**
     * Show the marker on the map
     */
    show() {
        if (this.marker && this.map) {
            this.marker.addTo(this.map);
            this.isVisible = true;
        }
    }
    
    /**
     * Hide the marker from the map
     */
    hide() {
        if (this.marker) {
            this.marker.remove();
            this.isVisible = false;
        }
    }
    
    /**
     * Get current position
     * @returns {Array} [longitude, latitude]
     */
    getPosition() {
        return this.currentPosition;
    }
    
    /**
     * Get current heading
     * @returns {number} Heading in degrees
     */
    getHeading() {
        return this.currentHeading;
    }
    
    /**
     * Update marker color
     * @param {string} color - New color (CSS color value)
     */
    setColor(color) {
        this.options.color = color;
        
        if (this.element) {
            const path = this.element.querySelector('path');
            if (path) {
                path.setAttribute('fill', color);
            }
        }
    }
    
    /**
     * Set glow effect visibility
     * @param {boolean} visible
     */
    setGlowVisible(visible) {
        if (this.element) {
            const glowRing = this.element.querySelector('.vehicle-glow-ring');
            if (glowRing) {
                glowRing.style.display = visible ? 'block' : 'none';
            }
        }
    }
    
    /**
     * Animate marker to a new position
     * @param {Array} targetLngLat - Target [longitude, latitude]
     * @param {number} targetHeading - Target heading in degrees
     * @param {number} duration - Animation duration in ms
     * @param {Function} easing - Easing function
     */
    animateTo(targetLngLat, targetHeading, duration = 500, easing = null) {
        if (!this.currentPosition) {
            this.setPosition(targetLngLat, targetHeading);
            return;
        }
        
        const startLng = this.currentPosition[0];
        const startLat = this.currentPosition[1];
        const startHeading = this.currentHeading;
        
        const deltaLng = targetLngLat[0] - startLng;
        const deltaLat = targetLngLat[1] - startLat;
        
        // Handle heading wrap-around (shortest path)
        let deltaHeading = targetHeading - startHeading;
        if (deltaHeading > 180) deltaHeading -= 360;
        if (deltaHeading < -180) deltaHeading += 360;
        
        const startTime = performance.now();
        const easingFn = easing || this._easeOutQuad;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easingFn(progress);
            
            const currentLng = startLng + deltaLng * easedProgress;
            const currentLat = startLat + deltaLat * easedProgress;
            const currentHeading = startHeading + deltaHeading * easedProgress;
            
            this.setPosition([currentLng, currentLat], currentHeading);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Ease out quad function
     * @private
     */
    _easeOutQuad(t) {
        return t * (2 - t);
    }
    
    /**
     * Remove the marker from the map and cleanup
     */
    destroy() {
        this.hide();
        this.marker = null;
        this.element = null;
        this.currentPosition = null;
    }
}

// Factory function for easy creation
function createVehicleMarker3D(map, options = {}) {
    const marker = new VehicleMarker3D(map, options);
    marker.initialize();
    return marker;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VehicleMarker3D, createVehicleMarker3D };
} else {
    window.VehicleMarker3D = VehicleMarker3D;
    window.createVehicleMarker3D = createVehicleMarker3D;
}
