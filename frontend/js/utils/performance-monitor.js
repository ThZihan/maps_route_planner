/**
 * Performance Monitor for 3D Map
 * Monitors FPS and adjusts quality settings for Optimal Performance
 */

class PerformanceMonitor {
    /**
     * Create performance monitor
     * @param {Object} map - Mapbox map instance
     * @param {Object} options - Monitor options
     */
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
                lowFPSThreshold: options.lowFPSThreshold || 30,
                highFPSThreshold: options.highFPSThreshold || 55,
                sampleSize: options.sampleSize || 60,
                checkInterval: options.checkInterval || 1000,
                onQualityChange: options.onQualityChange || null,
                onFPSUpdate: options.onFPSUpdate || null,
                ...options
            };
        
        // FPS tracking
        this.fpsHistory = [];
        this.frameCount = 0;
        this.lastCheckTime = performance.now();
        this.currentFPS = 0;
        this.averageFPS = 0;
        
        // Quality state
        this.currentQuality = 'high'; // 'high', 'medium', 'low'
        this.qualityPresets = {
            high: {
                buildingOpacity: 0.6,
                terrainExaggeration: 1.5,
                cameraSmoothing: 0.15,
                enableFog: true,
                enableGlow: true,
                updateInterval: 16
            },
            medium: {
                buildingOpacity: 0.4,
                terrainExaggeration: 1.2,
                cameraSmoothing: 0.2,
                enableFog: false,
                enableGlow: true,
                updateInterval: 24
            },
            low: {
                buildingOpacity: 0.2,
                terrainExaggeration: 1.0,
                cameraSmoothing: 0.3,
                enableFog: false,
                enableGlow: false,
                updateInterval: 33
            }
        };
        
        // Callbacks
        this.onQualityChange = this.options.onQualityChange;
        this.onFPSUpdate = this.options.onFPSUpdate;
        
        // State
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.lastFrameTime = 0;
    }
    
    /**
     * Start monitoring performance
     */
    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.lastCheckTime = performance.now();
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        
        // Start FPS counter using requestAnimationFrame
        this._countFrame();
        
        // Start periodic check
        this.monitoringInterval = setInterval(() => {
            this._checkPerformance();
        }, this.options.checkInterval);
        
        console.log('[PerformanceMonitor] Started monitoring');
    }
    
    /**
     * Stop monitoring
     */
    stop() {
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('[PerformanceMonitor] Stopped monitoring');
    }
    
    /**
     * Count frames using requestAnimationFrame
     * @private
     */
    _countFrame() {
        if (!this.isMonitoring) return;
        
        this.frameCount++;
        requestAnimationFrame(() => this._countFrame());
    }
    
    /**
     * Check performance and adjust quality if needed
     * @private
     */
    _checkPerformance() {
        const now = performance.now();
        const elapsed = now - this.lastCheckTime;
        
        // Calculate current FPS
        this.currentFPS = Math.round((this.frameCount / elapsed) * 1000);
        
        // Reset counters
        this.frameCount = 0;
        this.lastCheckTime = now;
        
        // Update history
        this.fpsHistory.push(this.currentFPS);
        if (this.fpsHistory.length > this.options.sampleSize) {
            this.fpsHistory.shift();
        }
        
        // Calculate average FPS
        if (this.fpsHistory.length > 0) {
            this.averageFPS = Math.round(
                this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
            );
        }
        
        // Callback for FPS update
        if (this.onFPSUpdate) {
            this.onFPSUpdate(this.currentFPS, this.averageFPS);
        }
        
        // Adjust quality based on performance
        this._adjustQuality();
    }
    
    /**
     * Adjust quality based on FPS
     * @private
     */
    _adjustQuality() {
        const avgFPS = this.averageFPS;
        const previousQuality = this.currentQuality;
        
        if (avgFPS < this.options.lowFPSThreshold && this.currentQuality !== 'low') {
            this._downgradeQuality();
        } else if (avgFPS > this.options.highFPSThreshold && this.currentQuality === 'low') {
            this._upgradeQuality();
        } else if (avgFPS > this.options.highFPSThreshold && this.currentQuality === 'medium') {
            this._upgradeQuality();
        }
        
        // Notify if quality changed
        if (previousQuality !== this.currentQuality && this.onQualityChange) {
            this.onQualityChange(this.currentQuality);
        }
    }
    
    /**
     * Downgrade quality
     * @private
     */
    _downgradeQuality() {
        if (this.currentQuality === 'high') {
            this.currentQuality = 'medium';
            console.log('[PerformanceMonitor] Quality downgraded to medium');
        } else if (this.currentQuality === 'medium') {
            this.currentQuality = 'low';
            console.log('[PerformanceMonitor] Quality downgraded to low');
        }
        
        this._applyQualitySettings();
    }
    
    /**
     * Upgrade quality
     * @private
     */
    _upgradeQuality() {
        if (this.currentQuality === 'low') {
            this.currentQuality = 'medium';
            console.log('[PerformanceMonitor] Quality upgraded to medium');
        } else if (this.currentQuality === 'medium') {
            this.currentQuality = 'high';
            console.log('[PerformanceMonitor] Quality upgraded to high');
        }
        
        this._applyQualitySettings();
    }
    
    /**
     * Apply quality settings to map
     * @private
     */
    _applyQualitySettings() {
        const settings = this.qualityPresets[this.currentQuality];
        const config = window.MAP_CONFIG;
        
        if (!this.map || !config) return;
        
        // Update building opacity
        if (this.map.getLayer('3d-buildings')) {
            this.map.setPaintProperty(
                '3d-buildings',
                'fill-extrusion-opacity',
                settings.buildingOpacity
            );
        }
        
        // Update terrain exaggeration
        if (this.map.getTerrain()) {
            this.map.setTerrain({
                source: 'mapbox-dem',
                exaggeration: settings.terrainExaggeration
            });
        }
        
        // Show/hide performance warning
        const warning = document.getElementById('performance-warning');
        if (warning) {
            if (this.currentQuality === 'low') {
                warning.classList.add('visible');
            } else {
                warning.classList.remove('visible');
            }
        }
    }
    
    /**
     * Get current quality
     * @returns {string} Current quality level
     */
    getQuality() {
        return this.currentQuality;
    }
    
    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getCurrentFPS() {
        return this.currentFPS;
    }
    
    /**
     * Get average FPS
     * @returns {number} Average FPS
     */
    getAverageFPS() {
        return this.averageFPS;
    }
    
    /**
     * Get quality settings for current level
     * @returns {Object} Quality settings
     */
    getQualitySettings() {
        return { ...this.qualityPresets[this.currentQuality] };
    }
    
    /**
     * Set quality manually
     * @param {string} quality - 'high', 'medium', or 'low'
     */
    setQuality(quality) {
        if (!this.qualityPresets[quality]) {
            console.warn(`[PerformanceMonitor] Invalid quality: ${quality}`);
            return;
        }
        
        const previousQuality = this.currentQuality;
        this.currentQuality = quality;
        this._applyQualitySettings();
        
        if (previousQuality !== quality && this.onQualityChange) {
            this.onQualityChange(quality);
        }
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.stop();
        this.map = null;
        this.onQualityChange = null;
        this.onFPSUpdate = null;
    }
}

// Export for use in Other Modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMonitor };
} else {
    window.PerformanceMonitor = PerformanceMonitor;
}
