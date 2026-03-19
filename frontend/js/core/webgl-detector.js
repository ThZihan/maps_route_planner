/**
 * WebGL Capability Detector
 * Detects WebGL support and recommends map mode based on device capabilities
 */

class WebGLDetector {
    constructor() {
        this.results = null;
    }
    
    /**
     * Detect WebGL capabilities
     * @returns {Object} Detection results
     */
    detect() {
        if (this.results) {
            return this.results;
        }
        
        const canvas = document.createElement('canvas');
        let gl = null;
        let webglVersion = 0;
        
        // Try WebGL2 first
        gl = canvas.getContext('webgl2');
        if (gl) {
            webglVersion = 2;
        } else {
            // Fall back to WebGL1
            gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                webglVersion = 1;
            }
        }
        
        const supported = !!gl;
        
        this.results = {
            supported: supported,
            webgl2: webglVersion === 2,
            webgl1: webglVersion === 1,
            version: webglVersion,
            maxTextureSize: supported ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
            maxRenderbufferSize: supported ? gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) : 0,
            renderer: supported ? this._getRendererInfo(gl) : 'none',
            vendor: supported ? gl.getParameter(gl.VENDOR) : 'none',
            recommended: this._getRecommendation(gl),
            isMobile: this._isMobile(),
            isLowEndDevice: this._isLowEndDevice(gl),
            timestamp: Date.now()
        };
        
        // Store in localStorage for quick access
        this._saveResults();
        
        return this.results;
    }
    
    /**
     * Get renderer information safely
     * @private
     */
    _getRendererInfo(gl) {
        try {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
            return gl.getParameter(gl.RENDERER);
        } catch (e) {
            return 'unknown';
        }
    }
    
    /**
     * Get recommendation for map mode
     * @private
     */
    _getRecommendation(gl) {
        if (!gl) {
            return '2d';
        }
        
        const textureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const renderer = this._getRendererInfo(gl).toLowerCase();
        
        // Check for software renderers (indicates no hardware acceleration)
        const softwareRenderers = ['swiftshader', 'llvmpipe', 'software', 'mesa'];
        if (softwareRenderers.some(sw => renderer.includes(sw))) {
            console.log('[WebGLDetector] Software renderer detected, recommending 2D mode');
            return '2d';
        }
        
        // Check for low texture size (indicates low-end GPU)
        if (textureSize < 4096) {
            console.log('[WebGLDetector] Low texture size detected, recommending 2D mode');
            return '2d';
        }
        
        // Check for integrated GPUs that might struggle
        const lowEndGPUs = ['intel hd', 'intel uhd', 'intel iris', 'mali-4', 'adreno 3'];
        if (lowEndGPUs.some(gpu => renderer.includes(gpu))) {
            console.log('[WebGLDetector] Low-end GPU detected, recommending 2D mode with 3D option');
            return '2d-preferred';
        }
        
        // Check if mobile device
        if (this._isMobile()) {
            // Mobile can support 3D but with optimizations
            return '3d-optimized';
        }
        
        return '3d';
    }
    
    /**
     * Check if running on mobile device
     * @private
     */
    _isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    }
    
    /**
     * Check if device is low-end
     * @private
     */
    _isLowEndDevice(gl) {
        if (!gl) return true;
        
        const textureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const renderer = this._getRendererInfo(gl).toLowerCase();
        
        // Low texture size indicates limited GPU memory
        if (textureSize < 4096) return true;
        
        // Check device memory (if available)
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            return true;
        }
        
        // Check hardware concurrency (CPU cores)
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            return true;
        }
        
        // Check for known low-end GPU patterns
        const lowEndPatterns = ['swiftshader', 'llvmpipe', 'intel hd graphics', 'mali-4'];
        if (lowEndPatterns.some(pattern => renderer.includes(pattern))) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Save detection results to localStorage
     * @private
     */
    _saveResults() {
        try {
            const config = window.MAP_CONFIG;
            if (config && config.storage) {
                localStorage.setItem(config.storage.webglDetected, JSON.stringify(this.results));
            }
        } catch (e) {
            console.warn('[WebGLDetector] Could not save results to localStorage:', e);
        }
    }
    
    /**
     * Load cached detection results
     * @returns {Object|null} Cached results or null
     */
    loadCachedResults() {
        try {
            const config = window.MAP_CONFIG;
            if (config && config.storage) {
                const cached = localStorage.getItem(config.storage.webglDetected);
                if (cached) {
                    const results = JSON.parse(cached);
                    // Cache is valid for 24 hours
                    if (Date.now() - results.timestamp < 24 * 60 * 60 * 1000) {
                        return results;
                    }
                }
            }
        } catch (e) {
            console.warn('[WebGLDetector] Could not load cached results:', e);
        }
        return null;
    }
    
    /**
     * Check if 3D mode is available
     * @returns {boolean}
     */
    is3DAvailable() {
        const results = this.detect();
        return results.supported && results.recommended !== '2d';
    }
    
    /**
     * Get optimal map mode
     * @returns {string} '2d' or '3d'
     */
    getOptimalMode() {
        const config = window.MAP_CONFIG;
        
        // If default mode is explicitly set, respect it
        if (config && config.defaultMode === '2d') {
            return '2d';
        }
        if (config && config.defaultMode === '3d') {
            const results = this.detect();
            return results.supported ? '3d' : '2d';
        }
        
        // Auto mode - use recommendation
        const results = this.detect();
        switch (results.recommended) {
            case '2d':
            case '2d-preferred':
                return '2d';
            case '3d':
            case '3d-optimized':
                return '3d';
            default:
                return '2d';
        }
    }
    
    /**
     * Log detection results for debugging
     */
    logResults() {
        const results = this.detect();
        console.group('[WebGLDetector] Detection Results');
        console.log('WebGL Supported:', results.supported);
        console.log('WebGL Version:', results.version);
        console.log('Renderer:', results.renderer);
        console.log('Max Texture Size:', results.maxTextureSize);
        console.log('Is Mobile:', results.isMobile);
        console.log('Is Low-End Device:', results.isLowEndDevice);
        console.log('Recommended Mode:', results.recommended);
        console.log('Optimal Mode:', this.getOptimalMode());
        console.groupEnd();
    }
}

// Create singleton instance
const webGLDetector = new WebGLDetector();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebGLDetector, webGLDetector };
} else {
    window.WebGLDetector = WebGLDetector;
    window.webGLDetector = webGLDetector;
}
