let animationId = null;
let isPlaying = false;
let progress = 0;
let animationSpeed = 1;
let startTime = 0;
let elapsedTime = 0;

const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const animationSpeedSlider = document.getElementById('animation-speed');
const animationSpeedDisplay = document.getElementById('animation-speed-display');
const progressDisplay = document.getElementById('progress-percent');
const timeElapsedDisplay = document.getElementById('time-elapsed');

animationSpeedSlider.addEventListener('input', (e) => {
    animationSpeed = parseInt(e.target.value);
    if (animationSpeedDisplay) {
        animationSpeedDisplay.textContent = `${animationSpeed}x`;
    }
});

btnPlay.addEventListener('click', () => {
    if (!isPlaying && window.routeCoordinates && window.routeCoordinates.length > 0) {
        isPlaying = true;
        startTime = performance.now() - elapsedTime;
        animate();
    }
});

btnPause.addEventListener('click', () => {
    isPlaying = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

btnReset.addEventListener('click', resetAnimation);

function resetAnimation() {
    isPlaying = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    progress = 0;
    elapsedTime = 0;
    updateProgress();
    
    // Reset vehicle to start
    if (window.routeCoordinates && window.routeCoordinates.length > 0) {
        const [lat, lng] = window.routeCoordinates[0];
        updateVehiclePosition(lat, lng);
    }
}

function animate() {
    if (!isPlaying) return;
    
    const currentTime = performance.now();
    elapsedTime = currentTime - startTime;
    
    // Calculate progress based on route duration
    // This ensures animation matches the displayed ETA
    const routeDuration = window.routeDurationSeconds || window.currentRoute?.duration || 60;
    const totalDuration = routeDuration * 1000; // Convert to ms
    // Divide by animationSpeed to make animation faster when speed increases
    // Multiply by 100 to convert decimal to percentage
    progress = (elapsedTime / (totalDuration / animationSpeed)) * 100;
    
    if (progress >= 100) {
        progress = 100;
        isPlaying = false;
    }
    
    updateProgress();
    
    // Update vehicle position
    updateVehicleAlongRoute();
    
    if (isPlaying) {
        animationId = requestAnimationFrame(animate);
    }
}

function updateProgress() {
    progressDisplay.textContent = Math.round(progress);
    
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeElapsedDisplay.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function updateVehicleAlongRoute() {
    if (!window.routeCoordinates || window.routeCoordinates.length < 2) return;
    
    const totalPoints = window.routeCoordinates.length;
    const currentIndex = Math.floor((progress / 100) * (totalPoints - 1));
    const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
    
    const fraction = ((progress / 100) * (totalPoints - 1)) - currentIndex;
    
    const [lat1, lng1] = window.routeCoordinates[currentIndex];
    const [lat2, lng2] = window.routeCoordinates[nextIndex];
    
    // Linear interpolation
    const lat = lat1 + (lat2 - lat1) * fraction;
    const lng = lng1 + (lng2 - lng1) * fraction;
    
    // Calculate heading
    const heading = Math.atan2(lng2 - lng1, lat2 - lat1) * (180 / Math.PI);
    
    updateVehiclePosition(lat, lng, heading);
}
