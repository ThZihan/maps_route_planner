/**
 * Map Adapter - Unified Interface for 2D/3D Mode Switching
 * Provides a consistent API for both Leaflet (2D) and Mapbox GL JS (3D) maps
 */

class MapAdapter {
    constructor() {
        this.currentMode = null; // '2d' or '3d'
        this.maps = {
            leaflet: null,  // Reference to existing Leaflet map
            mapbox: null    // New Mapbox map instance
        };
        
        // 3D Components
        this.components3D = {
            vehicleMarker: null,
            cameraController: null,
            animationEngine: null,
            performanceMonitor: null
        };
        
        this.sharedState = {
            startLocation: null,
            endLocation: null,
            route: null,
            routeCoordinates: [],
            vehiclePosition: null,
            animationProgress: 0,
            isAnimating: false
        };
        this.isInitialized = false;
        this.onModeChangeCallbacks = [];
    }
    
    /**
     * Initialize the adapter with the optimal mode
     * @param {Object} leafletMap - Existing Leaflet map instance
     * @returns {Promise<string>} The initialized mode
     */
    async initialize(leafletMap) {
        this.maps.leaflet = leafletMap;
        
        console.log('[MapAdapter] Initializing...');
        
        this.currentMode = '2d'; // Start with 2D (already loaded)
        this.isInitialized = true;
        
        return this.currentMode;
    }
    
    /**
     * Switch between 2D and 3D modes
     * @param {string} newMode - '2d' or '3d'
     * @returns {Promise<void>}
     */
    async switchMode(newMode) {
        if (this.currentMode === newMode) {
            console.log(`[MapAdapter] Already in ${newMode} mode`);
            return;
        }
        
        if (newMode === '3d' && !window.webGLDetector.is3DAvailable()) {
            console.warn('[MapAdapter] 3D mode not available, staying in 2D');
            return;
        }
        
        console.log(`[MapAdapter] Switching from ${this.currentMode} to ${newMode}`);
        
        // Save current state before switching
        this._saveState();
        
        // Dispatch before switch event
        this._dispatchEvent('beforemodeswitch', { from: this.currentMode, to: newMode });
        
        const oldMode = this.currentMode;
        
        try {
            // Hide current map
            this._hideMap(oldMode);
            
            // Initialize new map if needed
            if (newMode === '3d' && !this.maps.mapbox) {
                await this._initializeMapbox();
            }
            
            // Show new map
            this._showMap(newMode);
            
            // Restore state on new map
            await this._restoreState(newMode);
            
            // Update current mode
            this.currentMode = newMode;
            
            // Save preference
            this._saveModePreference(newMode);
            
            // Dispatch after switch event
            this._dispatchEvent('aftermodeswitch', { from: oldMode, to: newMode });
            
            // Run callbacks
            this.onModeChangeCallbacks.forEach(cb => cb(newMode, oldMode));
            
        } catch (error) {
            console.error('[MapAdapter] Error switching mode:', error);
            // Fallback to 2D on error
            this._showMap('2d');
            this.currentMode = '2d';
            throw error;
        }
    }
    
    /**
     * Initialize Mapbox GL JS map
     * @private
     */
    async _initializeMapbox() {
        console.log('[MapAdapter] Initializing Mapbox GL JS...');
        
        // Check if Mapbox GL JS is loaded
        if (typeof mapboxgl === 'undefined') {
            await this._loadMapboxScript();
        }
        
        const config = window.MAP_CONFIG;
        
        // Create map container if it doesn't exist
        let mapboxContainer = document.getElementById('mapbox-container');
        if (!mapboxContainer) {
            mapboxContainer = document.createElement('div');
            mapboxContainer.id = 'mapbox-container';
            // Use 'map' class to inherit flex:1 styling, plus 'mapbox-container' for3D-specific styles
            mapboxContainer.className = 'map mapbox-container';
            
            // Insert after leaflet container (both are siblings in the flex container)
            const leafletContainer = document.getElementById('map');
            leafletContainer.parentNode.insertBefore(mapboxContainer, leafletContainer.nextSibling);
        }
        
        // Initialize Mapbox map
        mapboxgl.accessToken = config.mapbox.token;
        
        this.maps.mapbox = new mapboxgl.Map({
            container: 'mapbox-container',
            style: config.mapbox.style,
            center: [90.4125, 23.8103], // Dhaka center (will be updated)
            zoom: 12,
            pitch: 0,
            bearing: 0,
            antialias: true
        });
        
        // Add navigation controls
        this.maps.mapbox.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add scale control
        this.maps.mapbox.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
        
        // Wait for map to load
        return new Promise((resolve, reject) => {
            this.maps.mapbox.on('load', () => {
                console.log('[MapAdapter] Mapbox map loaded');
                this._setupMapboxLayers();
                this._initialize3DComponents();
                resolve();
            });
            
            this.maps.mapbox.on('error', (e) => {
                console.error('[MapAdapter] Mapbox error:', e);
                reject(e);
            });
        });
    }
    
    /**
     * Load Mapbox GL JS script dynamically
     * @private
     */
    async _loadMapboxScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof mapboxgl !== 'undefined') {
                resolve();
                return;
            }
            
            // Load CSS
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.18.0/mapbox-gl.css';
            document.head.appendChild(css);
            
            // Load JS
            const script = document.createElement('script');
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.18.0/mapbox-gl.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Setup Mapbox layers (terrain, buildings, etc.)
     * @private
     */
    _setupMapboxLayers() {
        const map = this.maps.mapbox;
        const config = window.MAP_CONFIG;
        
        // Add terrain source
        if (config.terrain.enabled) {
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: config.mapbox.terrainSource,
                tileSize: 512,
                maxzoom: 14
            });
            
            map.setTerrain({
                source: 'mapbox-dem',
                exaggeration: config.terrain.exaggeration
            });
        }
        
        // Add fog for atmosphere (desktop only)
        if (config.terrain.fog && !this._isMobile()) {
            map.setFog({});
        }
        
        // Add 3D buildings
        if (config.buildings.enabled) {
            this._add3DBuildings();
        }
        
        // Add route source (empty initially)
        map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: []
                }
            }
        });
        
        // Add route glow layer (behind main route)
        map.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': config.route.glowColor,
                'line-width': config.route.glowWidth,
                'line-opacity': 0.3,
                'line-blur': 4
            }
        });
        
        // Add main route layer
        map.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': config.route.lineColor,
                'line-width': config.route.lineWidth,
                'line-opacity': config.route.opacity
            }
        });
        
        console.log('[MapAdapter] Mapbox layers setup complete');
    }
    
    /**
     * Add 3D buildings layer
     * @private
     */
    _add3DBuildings() {
        const map = this.maps.mapbox;
        const config = window.MAP_CONFIG;
        
        // Find the first symbol layer to insert buildings below labels
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
        )?.id;
        
        map.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: config.buildings.minZoom,
            paint: {
                'fill-extrusion-color': config.buildings.color,
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15, 0,
                    15.05, ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15, 0,
                    15.05, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': config.buildings.opacity
            }
        }, labelLayerId);
    }
    
    /**
     * Initialize 3D components (vehicle marker, camera controller, animation engine)
     * @private
     */
    _initialize3DComponents() {
        const map = this.maps.mapbox;
        const config = window.MAP_CONFIG;
        
        console.log('[MapAdapter] Initializing3D components...');
        console.log('[MapAdapter] VehicleMarker3D available:', !!window.VehicleMarker3D);
        console.log('[MapAdapter] CameraController3D available:', !!window.CameraController3D);
        console.log('[MapAdapter] AnimationEngine3D available:', !!window.AnimationEngine3D);
        console.log('[MapAdapter] PerformanceMonitor available:', !!window.PerformanceMonitor);
        
        // Initialize vehicle marker
        if (window.VehicleMarker3D) {
            this.components3D.vehicleMarker = new VehicleMarker3D(map, {
                size: config.vehicle.markerSize,
                color: config.vehicle.color,
                glowColor: config.vehicle.glowColor
            }).initialize();
            console.log('[MapAdapter] Vehicle marker initialized');
        } else {
            console.error('[MapAdapter] VehicleMarker3D class not found!');
        }
        
        // Initialize camera controller
        if (window.CameraController3D) {
            this.components3D.cameraController = new CameraController3D(map, {
                pitch: config.camera.pitch,
                distance: config.camera.distance,
                heightOffset: config.camera.heightOffset,
                smoothingFactor: config.camera.smoothingFactor
            });
            console.log('[MapAdapter] Camera controller initialized');
        } else {
            console.error('[MapAdapter] CameraController3D class not found!');
        }
        
        // Initialize animation engine
        if (window.AnimationEngine3D && this.components3D.vehicleMarker && this.components3D.cameraController) {
            this.components3D.animationEngine = new AnimationEngine3D(
                map,
                this.components3D.vehicleMarker,
                this.components3D.cameraController
            );
            console.log('[MapAdapter] Animation engine initialized');
        } else {
            console.error('[MapAdapter] Cannot initialize animation engine:', {
                hasAnimationEngine: !!window.AnimationEngine3D,
                hasVehicleMarker: !!this.components3D.vehicleMarker,
                hasCameraController: !!this.components3D.cameraController
            });
        }
        
        // Initialize performance monitor
        if (window.PerformanceMonitor) {
            this.components3D.performanceMonitor = new PerformanceMonitor(map, {
                onQualityChange: (quality) => this._onQualityChange(quality)
            });
            this.components3D.performanceMonitor.start();
            console.log('[MapAdapter] Performance monitor initialized');
        }
        
        console.log('[MapAdapter] 3D components initialization complete:', this.components3D);
    }
    
    /**
     * Handle quality change from performance monitor
     * @private
     */
    _onQualityChange(quality) {
        console.log(`[MapAdapter] Quality changed to: ${quality}`);
        
        const config = window.MAP_CONFIG;
        const map = this.maps.mapbox;
        
        if (!map) return;
        
        // Update building opacity
        if (map.getLayer('3d-buildings')) {
            const opacity = quality === 'high' ? 0.6 : quality === 'medium' ? 0.4 : 0.2;
            map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', opacity);
        }
        
        // Update camera smoothing
        if (this.components3D.cameraController) {
            const smoothing = quality === 'high' ? 0.15 : quality === 'medium' ? 0.2 : 0.3;
            this.components3D.cameraController.setSmoothing(smoothing);
        }
    }
    
    /**
     * Check if running on mobile device
     * @private
     */
    _isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Hide a map
     * @private
     */
    _hideMap(mode) {
        if (mode === '2d') {
            const leafletContainer = document.getElementById('map');
            if (leafletContainer) {
                leafletContainer.style.display = 'none';
            }
        } else if (mode === '3d') {
            const mapboxContainer = document.getElementById('mapbox-container');
            if (mapboxContainer) {
                mapboxContainer.style.display = 'none';
            }
        }
    }
    
    /**
     * Show a map
     * @private
     */
    _showMap(mode) {
        if (mode === '2d') {
            const leafletContainer = document.getElementById('map');
            if (leafletContainer) {
                leafletContainer.style.display = 'block';
            }
            // Trigger resize for Leaflet (invalidateSize is on the map instance)
            if (this.maps.leaflet) {
                setTimeout(() => {
                    this.maps.leaflet.invalidateSize();
                }, 100);
            }
        } else if (mode === '3d') {
            const mapboxContainer = document.getElementById('mapbox-container');
            if (mapboxContainer) {
                mapboxContainer.style.display = 'block';
            }
            // Reset 3D animation to ensure clean state
            if (this.components3D.animationEngine) {
                this.components3D.animationEngine.pause();
                this.components3D.animationEngine.progress = 0;
                this.components3D.animationEngine.elapsedTime = 0;
                console.log('[MapAdapter] 3D animation reset before showing map');
            }
            // Trigger resize to ensure proper rendering
            // Use requestAnimationFrame to ensure DOM has updated
            if (this.maps.mapbox) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.maps.mapbox.resize();
                        console.log('[MapAdapter] Mapbox resize triggered after container visible');
                    });
                });
            }
        }
    }
    
    /**
     * Save current state before switching
     * @private
     */
    _saveState() {
        // Get route data from window globals (set by existing route.js)
        this.sharedState.routeCoordinates = window.routeCoordinates || [];
        this.sharedState.route = window.currentRoute || null;
        
        // Get animation progress
        if (typeof progress !== 'undefined') {
            this.sharedState.animationProgress = progress;
        }
        
        // Get marker positions if available
        if (typeof startMarker !== 'undefined' && startMarker) {
            const pos = startMarker.getLatLng();
            this.sharedState.startLocation = [pos.lat, pos.lng];
        }
        if (typeof endMarker !== 'undefined' && endMarker) {
            const pos = endMarker.getLatLng();
            this.sharedState.endLocation = [pos.lat, pos.lng];
        }
        
        console.log('[MapAdapter] State saved:', this.sharedState);
    }
    
    /**
     * Restore state after switching
     * @private
     */
    async _restoreState(mode) {
        if (mode === '3d' && this.maps.mapbox) {
            const map = this.maps.mapbox;
            
            // Update route if available
            if (this.sharedState.routeCoordinates.length > 0) {
                // Convert [lat, lng] to [lng, lat] for Mapbox
                const coordinates = this.sharedState.routeCoordinates.map(coord => [coord[1], coord[0]]);
                
                map.getSource('route')?.setData({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                });
                
                // Set route in animation engine
                if (this.components3D.animationEngine) {
                    const duration = window.routeDurationSeconds || 60;
                    this.components3D.animationEngine.setRoute(coordinates, duration);
                }
                
                // Fit bounds to show entire route
                if (coordinates.length > 0) {
                    const bounds = coordinates.reduce((bounds, coord) => {
                        return bounds.extend(coord);
                    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
                    
                    map.fitBounds(bounds, { padding: 50, pitch: 0 });
                }
            }
            
            // Center map on start location if available
            if (this.sharedState.startLocation) {
                map.flyTo({
                    center: [this.sharedState.startLocation[1], this.sharedState.startLocation[0]],
                    zoom: 14
                });
            }
        }
        
        console.log('[MapAdapter] State restored for', mode, 'mode');
    }
    
    /**
     * Save mode preference to localStorage
     * @private
     */
    _saveModePreference(mode) {
        try {
            const config = window.MAP_CONFIG;
            localStorage.setItem(config.storage.modePreference, mode);
        } catch (e) {
            console.warn('[MapAdapter] Could not save mode preference:', e);
        }
    }
    
    /**
     * Load mode preference from localStorage
     * @private
     */
    _loadModePreference() {
        try {
            const config = window.MAP_CONFIG;
            return localStorage.getItem(config.storage.modePreference);
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Dispatch custom event
     * @private
     */
    _dispatchEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    
    /**
     * Register callback for mode changes
     * @param {Function} callback - Function(newMode, oldMode)
     */
    onModeChange(callback) {
        this.onModeChangeCallbacks.push(callback);
    }
    
    /**
     * Remove mode change callback
     * @param {Function} callback
     */
    offModeChange(callback) {
        const index = this.onModeChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.onModeChangeCallbacks.splice(index, 1);
        }
    }
    
    /**
     * Get current mode
     * @returns {string} '2d' or '3d'
     */
    getMode() {
        return this.currentMode;
    }
    
    /**
     * Get active map instance
     * @returns {Object} Leaflet or Mapbox map
     */
    getActiveMap() {
        return this.currentMode === '3d' ? this.maps.mapbox : this.maps.leaflet;
    }
    
    /**
     * Check if 3D is available
     * @returns {boolean}
     */
    is3DAvailable() {
        return window.webGLDetector.is3DAvailable();
    }
    
    /**
     * Update route on both maps
     * @param {Array} coordinates - Route coordinates [[lat, lng], ...]
     * @param {number} duration - Route duration in seconds
     */
    updateRoute(coordinates, duration) {
        this.sharedState.routeCoordinates = coordinates;
        
        if (this.currentMode === '3d' && this.maps.mapbox) {
            // Convert to Mapbox format [lng, lat]
            const mapboxCoords = coordinates.map(c => [c[1], c[0]]);
            
            this.maps.mapbox.getSource('route')?.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: mapboxCoords
                }
            });
            
            // Update animation engine
            if (this.components3D.animationEngine) {
                this.components3D.animationEngine.setRoute(mapboxCoords, duration);
            }
        }
    }
    
    /**
     * Play 3D animation
     */
    playAnimation3D() {
        console.log('[MapAdapter] playAnimation3D called, mode:', this.currentMode);
        
        if (this.currentMode !== '3d') {
            console.warn('[MapAdapter] Not in3D mode, cannot play3D animation');
            return;
        }
        
        if (!this.components3D.animationEngine) {
            console.error('[MapAdapter] Animation engine not initialized');
            return;
        }
        
        // Ensure route is set before playing
        if (this.sharedState.routeCoordinates.length > 0) {
            const duration = window.routeDurationSeconds || 60;
            const mapboxCoords = this.sharedState.routeCoordinates.map(c => [c[1], c[0]]);
            console.log('[MapAdapter] Setting route before play:', mapboxCoords.length, 'points');
            this.components3D.animationEngine.setRoute(mapboxCoords, duration);
        }
        
        this.components3D.animationEngine.play();
    }
    
    /**
     * Pause 3D animation
     */
    pauseAnimation3D() {
        if (this.currentMode === '3d' && this.components3D.animationEngine) {
            this.components3D.animationEngine.pause();
        }
    }
    
    /**
     * Reset 3D animation
     */
    resetAnimation3D() {
        if (this.currentMode === '3d' && this.components3D.animationEngine) {
            this.components3D.animationEngine.reset();
        }
    }
    
    /**
     * Set 3D animation speed
     * @param {number} speed - Speed multiplier
     */
    setAnimationSpeed3D(speed) {
        if (this.currentMode === '3d' && this.components3D.animationEngine) {
            this.components3D.animationEngine.setSpeed(speed);
        }
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        // Stop performance monitor
        if (this.components3D.performanceMonitor) {
            this.components3D.performanceMonitor.stop();
        }
        
        // Destroy animation engine
        if (this.components3D.animationEngine) {
            this.components3D.animationEngine.destroy();
        }
        
        // Destroy camera controller
        if (this.components3D.cameraController) {
            this.components3D.cameraController.destroy();
        }
        
        // Destroy vehicle marker
        if (this.components3D.vehicleMarker) {
            this.components3D.vehicleMarker.destroy();
        }
        
        // Remove mapbox map
        if (this.maps.mapbox) {
            this.maps.mapbox.remove();
            this.maps.mapbox = null;
        }
        
        const mapboxContainer = document.getElementById('mapbox-container');
        if (mapboxContainer) {
            mapboxContainer.remove();
        }
    }
}

// Create singleton instance
const mapAdapter = new MapAdapter();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapAdapter, mapAdapter };
} else {
    window.MapAdapter = MapAdapter;
    window.mapAdapter = mapAdapter;
}
