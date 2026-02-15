// Initialize map
const map = L.map('map').setView([23.8103, 90.4125], 12); // Dhaka center

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Markers
let startMarker = null;
let endMarker = null;
let routeLayer = null;
let vehicleMarker = null;

// Custom marker icons with colors
const startIcon = L.divIcon({
    className: 'custom-marker-icon',
    html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.7 12.5 28.5 12.5 28.5S25 21.2 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#166534"/>
        <circle cx="12.5" cy="12.5" r="5" fill="#ffffff"/>
    </svg>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const endIcon = L.divIcon({
    className: 'custom-marker-icon',
    html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.7 12.5 28.5 12.5 28.5S25 21.2 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#991b1b"/>
        <circle cx="12.5" cy="12.5" r="5" fill="#ffffff"/>
    </svg>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const vehicleIcon = L.divIcon({
    className: 'custom-marker-icon',
    html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.7 12.5 28.5 12.5 28.5S25 21.2 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#3b82f6"/>
        <circle cx="12.5" cy="12.5" r="5" fill="#ffffff"/>
    </svg>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

// Map click handler
// Track which input field was last focused
let lastFocusedInput = null;

// Update last focused input when user types in input fields
document.getElementById('start-location').addEventListener('focus', () => {
    lastFocusedInput = 'start';
});
document.getElementById('end-location').addEventListener('focus', () => {
    lastFocusedInput = 'end';
});

// Add input change listeners to clear route when user manually types
document.getElementById('start-location').addEventListener('input', () => {
    clearRoute();
});

document.getElementById('end-location').addEventListener('input', () => {
    clearRoute();
});

map.on('click', (e) => {
    // If user was last typing in start-location, update it
    if (lastFocusedInput === 'start') {
        setStartLocation(e.latlng.lat, e.latlng.lng);
    }
    // If user was last typing in end-location, update it
    else if (lastFocusedInput === 'end') {
        setEndLocation(e.latlng.lat, e.latlng.lng);
    }
    // If neither input was focused (direct map click), use default cycle
    else {
        if (!startMarker) {
            setStartLocation(e.latlng.lat, e.latlng.lng);
        } else if (!endMarker) {
            setEndLocation(e.latlng.lat, e.latlng.lng);
        } else {
            // Reset and set new start
            clearRoute();
            setStartLocation(e.latlng.lat, e.latlng.lng);
        }
    }
});

function setStartLocation(lat, lng) {
    // Clear existing route when start location changes
    clearRoute();
    
    if (startMarker) {
        map.removeLayer(startMarker);
    }
    try {
        startMarker = L.marker([lat, lng], { icon: startIcon, draggable: true }).addTo(map);
    } catch (error) {
        console.error('Error creating start marker:', error);
    }
    document.getElementById('start-location').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Add drag event listener to clear route when marker is dragged
    startMarker.on('dragend', function(e) {
        const newPos = e.target.getLatLng();
        document.getElementById('start-location').value = `${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`;
        clearRoute();
    });
}

function setEndLocation(lat, lng) {
    // Clear existing route when end location changes
    clearRoute();
    
    if (endMarker) {
        map.removeLayer(endMarker);
    }
    endMarker = L.marker([lat, lng], { icon: endIcon, draggable: true }).addTo(map);
    document.getElementById('end-location').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Add drag event listener to clear route when marker is dragged
    endMarker.on('dragend', function(e) {
        const newPos = e.target.getLatLng();
        document.getElementById('end-location').value = `${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`;
        clearRoute();
    });
}

function clearRoute(clearCoordinates = true) {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
    if (vehicleMarker) {
        map.removeLayer(vehicleMarker);
        vehicleMarker = null;
    }
    
    // Reset distance and ETA displays
    document.getElementById('distance').textContent = '';
    document.getElementById('eta').textContent = '';
    
    // Reset global route state
    window.currentRoute = null;
    window.routeDurationSeconds = null;
    
    // Only clear coordinates if explicitly requested (e.g., when user changes start/end location)
    // When drawRoute is called, we pass false to preserve coordinates for animation
    if (clearCoordinates) {
        window.routeCoordinates = [];
    }
}

function drawRoute(geojson) {
    clearRoute(false); // Don't clear coordinates - they're needed for animation
    
    // Extract coordinates from GeoJSON
    const coordinates = geojson.coordinates;
    if (!coordinates || coordinates.length < 2) return;
    
    // Create a feature group to hold all route layers
    routeLayer = L.featureGroup();
    
    // Create SVG gradients definition
    const svgNamespace = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(svgNamespace, "defs");
    
    // Main water gradient - Vibrant blue to cyan
    const gradient = document.createElementNS(svgNamespace, "linearGradient");
    gradient.setAttribute("id", "waterGradient");
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    
    const stop1 = document.createElementNS(svgNamespace, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#3b82f6");
    
    const stop2 = document.createElementNS(svgNamespace, "stop");
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", "#22d3ee");
    
    const stop3 = document.createElementNS(svgNamespace, "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", "#3b82f6");
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defs.appendChild(gradient);
    
    // Add defs to the map's SVG
    setTimeout(() => {
        const mapSvg = document.querySelector('.leaflet-overlay-pane svg');
        if (mapSvg) {
            mapSvg.insertBefore(defs, mapSvg.firstChild);
        }
    }, 100);
    
    // Convert coordinates to Leaflet format
    const latlngs = coordinates.map(coord => [coord[1], coord[0]]);
    
    // 1. Base path (solid, low opacity)
    const basePath = L.polyline(latlngs, {
        className: 'route-path-base',
        weight: 6,
        opacity: 0.8
    }).addTo(routeLayer);
    
    // 2. Glow effect path
    const glowPath = L.polyline(latlngs, {
        className: 'route-path-glow',
        weight: 12,
        opacity: 0.2
    }).addTo(routeLayer);
    
    // 3. Main flowing path with gradient
    const flowPath = L.polyline(latlngs, {
        className: 'route-path-flow',
        weight: 6,
        opacity: 1
    }).addTo(routeLayer);
    
    // 4. Wave effect path
    const wavePath = L.polyline(latlngs, {
        className: 'route-path-wave',
        weight: 2,
        opacity: 0.6
    }).addTo(routeLayer);
    
    // Add floating particles
    addFlowParticles(latlngs);
    
    // Add the feature group to the map
    routeLayer.addTo(map);
    
    // Fit bounds to show entire route
    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
}

// Add floating particles along the path
function addFlowParticles(latlngs) {
    const particleCount = Math.min(15, Math.floor(latlngs.length / 10));
    
    for (let i = 0; i < particleCount; i++) {
        const randomIndex = Math.floor(Math.random() * latlngs.length);
        const point = latlngs[randomIndex];
        
        const particleIcon = L.divIcon({
            className: 'route-particle-icon',
            html: `<svg width="8" height="8" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" fill="#00d4ff" opacity="0.8"/>
            </svg>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4]
        });
        
        const particle = L.marker(point, { icon: particleIcon, interactive: false }).addTo(routeLayer);
        
        // Animate the particle
        animateParticle(particle, latlngs, randomIndex);
    }
}

// Animate particle along the path
function animateParticle(marker, latlngs, startIndex) {
    let currentIndex = startIndex;
    let progress = 0;
    
    function moveParticle() {
        const nextIndex = (currentIndex + 1) % latlngs.length;
        const currentPoint = latlngs[currentIndex];
        
        marker.setLatLng(currentPoint);
        
        currentIndex = nextIndex;
        
        // Continue animation
        setTimeout(moveParticle, 150 + Math.random() * 100);
    }
    
    // Start animation with delay
    setTimeout(moveParticle, Math.random() * 2000);
}

function updateVehiclePosition(lat, lng, heading = 0) {
    if (!vehicleMarker) {
        vehicleMarker = L.marker([lat, lng], { icon: vehicleIcon }).addTo(map);
    } else {
        vehicleMarker.setLatLng([lat, lng]);
    }
    
    // Update rotation based on heading
    const iconElement = vehicleMarker.getElement();
    if (iconElement) {
        const divElement = iconElement.querySelector('div');
        if (divElement) {
            divElement.style.transform = `rotate(${heading}deg)`;
        }
    }
}
