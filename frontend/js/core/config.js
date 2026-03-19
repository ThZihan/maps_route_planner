/**
 * Centralized Configuration for 3D Map Implementation
 * This file contains all configurable settings for the Mapbox GL JS 3D map
 */

const CONFIG = {
    // Mode settings
    defaultMode: 'auto', // '2d', '3d', or 'auto' (based on WebGL detection)
    
    // Mapbox configuration
    mapbox: {
        // Use environment variable or window.MAPBOX_TOKEN if available, otherwise placeholder
        token: window.MAPBOX_TOKEN || 'YOUR_MAPBOX_PUBLIC_TOKEN_HERE',
        style: 'mapbox://styles/mapbox/streets-v12',
        terrainSource: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        // Alternative styles:
        // 'mapbox://styles/mapbox/satellite-streets-v12'
        // 'mapbox://styles/mapbox/outdoors-v12'
        // 'mapbox://styles/mapbox/navigation-night-v1'
    },
    
    // Camera settings for third-person view
    camera: {
        pitch: 45,              // Camera tilt angle (0-85 degrees)
        distance: 150,          // Distance behind vehicle in meters
        heightOffset: 30,       // Height above vehicle in meters
        smoothingFactor: 0.15,  // Camera lag for smooth follow (0-1, lower = smoother)
        bearingSmoothing: 0.1,  // Bearing interpolation factor
        maxSpeed: 500,          // Max speed for interpolation calculations
        fov: 36                 // Field of view
    },
    
    // Performance settings
    performance: {
        targetFPS: 60,
        minZoom3D: 12,          // Minimum zoom for 3D features
        buildingMinZoom: 15,    // Minimum zoom for 3D buildings
        terrainExaggeration: 1.2,
        enableMobileOptimizations: true,
        adaptiveQuality: true,  // Auto-adjust quality based on FPS
        lowFPSThreshold: 30,    // FPS below this triggers quality reduction
        highFPSThreshold: 55    // FPS above this triggers quality increase
    },
    
    // Vehicle marker settings
    vehicle: {
        markerSize: 40,         // Marker size in pixels
        updateInterval: 16,     // Update interval in ms (~60fps)
        color: '#3b82f6',       // Primary vehicle color
        glowColor: '#22d3ee'    // Glow effect color
    },
    
    // Route visualization settings
    route: {
        lineColor: '#3b82f6',
        lineWidth: 4,
        glowColor: '#22d3ee',
        glowWidth: 8,
        opacity: 0.8
    },
    
    // 3D Building settings
    buildings: {
        enabled: true,
        minZoom: 15,
        opacity: 0.6,
        color: '#aaa',
        baseColor: '#666'
    },
    
    // Terrain settings
    terrain: {
        enabled: true,
        exaggeration: 1.5,
        fog: true
    },
    
    // Mobile-specific optimizations
    mobile: {
        // Reduce building density on mobile
        buildingFilter: ['<', ['get', 'height'], 50],
        // Lower terrain resolution
        terrainTileSize: 256,
        // Simplified route rendering
        routeTolerance: 0.0001,
        // Throttled camera updates
        cameraUpdateInterval: 32,
        // Disable expensive effects
        enableFog: false,
        enableSky: false,
        // Reduced target FPS
        targetFPS: 30
    },
    
    // Storage keys for persistence
    storage: {
        modePreference: 'map_mode_preference',
        webglDetected: 'webgl_detected',
        lastPosition: 'last_map_position'
    },
    
    // API endpoints (reuse existing backend)
    api: {
        baseUrl: '/api',
        routeEndpoint: '/route',
        searchEndpoint: '/search',
        etaEndpoint: '/eta'
    }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.mapbox);
Object.freeze(CONFIG.camera);
Object.freeze(CONFIG.performance);
Object.freeze(CONFIG.vehicle);
Object.freeze(CONFIG.route);
Object.freeze(CONFIG.buildings);
Object.freeze(CONFIG.terrain);
Object.freeze(CONFIG.mobile);
Object.freeze(CONFIG.storage);
Object.freeze(CONFIG.api);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.MAP_CONFIG = CONFIG;
}
