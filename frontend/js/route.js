// Use absolute URL to ensure requests go to correct backend
const API_BASE = 'http://localhost:3000/api';

let currentRoute = null;
let routeCoordinates = [];
let routeDurationSeconds = null; // Store user's vehicle speed based duration

// Speed slider
const speedSlider = document.getElementById('vehicle-speed');
const speedDisplay = document.getElementById('speed-display');

speedSlider.addEventListener('input', (e) => {
    speedDisplay.textContent = `${e.target.value} km/h`;
});

// Search functionality
const startInput = document.getElementById('start-location');
const endInput = document.getElementById('end-location');
const startSuggestions = document.getElementById('start-suggestions');
const endSuggestions = document.getElementById('end-suggestions');

let searchTimeout;

function setupSearch(input, suggestions, type) {
    input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            suggestions.classList.remove('visible');
            return;
        }
        
        searchTimeout = setTimeout(() => searchLocation(query, suggestions, type), 300);
    });
}

setupSearch(startInput, startSuggestions, 'start');
setupSearch(endInput, endSuggestions, 'end');

async function searchLocation(query, suggestions, type) {
    try {
        // Show loading state
        suggestions.innerHTML = '<div class="suggestion-item">Loading...</div>';
        suggestions.classList.add('visible');
        
        // Use full URL with encoded query parameter
        const fullUrl = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
        console.log(`[Frontend] Search URL: ${fullUrl}`);
        console.log(`[Frontend] Current origin: ${window.location.origin}`);
        
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`[Frontend] Response status: ${response.status}`);
        console.log(`[Frontend] Response ok: ${response.ok}`);
        
        const data = await response.json();
        console.log(`[Frontend] Response data:`, data);
        
        if (data.success && data.locations.length > 0) {
            suggestions.innerHTML = data.locations.map(loc => 
                `<div class="suggestion-item" data-lat="${loc.lat}" data-lon="${loc.lon}">
                    ${loc.display_name}
                </div>`
            ).join('');
            suggestions.classList.add('visible');
            
            // Add click handlers
            suggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const lat = parseFloat(item.dataset.lat);
                    const lon = parseFloat(item.dataset.lon);
                    
                    if (type === 'start') {
                        setStartLocation(lat, lon);
                        map.setView([lat, lon], 14);
                    } else {
                        setEndLocation(lat, lon);
                        map.setView([lat, lon], 14);
                    }
                    
                    suggestions.classList.remove('visible');
                });
            });
        } else {
            suggestions.classList.remove('visible');
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Calculate route
document.getElementById('calculate-route').addEventListener('click', calculateRoute);

async function calculateRoute() {
    if (!startMarker || !endMarker) {
        alert('Please select both start and end locations');
        return;
    }
    
    const start = startMarker.getLatLng();
    const end = endMarker.getLatLng();
    
    const startCoords = `${start.lng},${start.lat}`;
    const endCoords = `${end.lng},${end.lat}`;
    
    try {
        const response = await fetch(`${API_BASE}/route`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start: startCoords, end: endCoords })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentRoute = data.route;
            routeCoordinates = data.route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            
            // Update global state
            window.currentRoute = currentRoute;
            window.routeCoordinates = routeCoordinates;
            
            // Draw route on map
            drawRoute(data.route.geometry);
            
            // Update route info
            const distanceKm = (data.route.distance / 1000).toFixed(2);
            document.getElementById('distance').textContent = `${distanceKm} km`;
            
            // Calculate ETA
            const speed = parseInt(speedSlider.value);
            const etaResponse = await fetch(`${API_BASE}/eta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ distance: data.route.distance, speed })
            });
            
            const etaData = await etaResponse.json();
            console.log('[Route Debug] ETA response:', etaData);
            
            // Format ETA with seconds for better precision
            const totalSeconds = etaData.eta.seconds;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.round(totalSeconds % 60);
            
            let formattedETA = '';
            if (hours > 0) {
                formattedETA += `${hours}h `;
            }
            if (minutes > 0 || hours > 0) {
                formattedETA += `${minutes}m `;
            }
            formattedETA += `${seconds}s`;
            
            console.log('[Route Debug] Calculated ETA:', { totalSeconds, hours, minutes, seconds, formattedETA });
            
            document.getElementById('eta').textContent = formattedETA;
            
            // Store the user's vehicle speed based duration for animation
            routeDurationSeconds = totalSeconds;
            window.routeDurationSeconds = routeDurationSeconds;
            console.log('[Route Debug] Stored routeDurationSeconds:', routeDurationSeconds);
            
            // Show route info and animation controls
            document.getElementById('route-info').classList.remove('hidden');
            document.getElementById('animation-controls').classList.remove('hidden');
            
            // Reset animation
            resetAnimation();
        } else {
            alert('Failed to calculate route: ' + data.error);
        }
    } catch (error) {
        console.error('Route calculation error:', error);
        alert('Failed to calculate route');
    }
}

// Export for animation module
window.currentRoute = currentRoute;
window.routeCoordinates = routeCoordinates;
