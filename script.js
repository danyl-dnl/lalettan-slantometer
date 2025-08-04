const imageUpload = document.getElementById('imageUpload');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d');
const resultsDiv = document.getElementById('results');
const angleResult = document.getElementById('angleResult');
const sinResult = document.getElementById('sinResult');
const cosResult = document.getElementById('cosResult');
const tanResult = document.getElementById('tanResult');
const resetButton = document.getElementById('resetButton');
const messageBox = document.getElementById('messageBox');

let points = [];
let img = new Image();
let imageLoaded = false;
let originalImageWidth = 0;
let originalImageHeight = 0;

// Function to display messages in the message box
function showMessage(message, type = 'info') {
    messageBox.textContent = message;
    messageBox.className = `message-box ${type === 'error' ? 'bg-red-200 text-red-800 border-red-400' : 'bg-blue-200 text-blue-800 border-blue-400'}`;
    messageBox.classList.remove('hidden');
}

// Function to hide the message box
function hideMessage() {
    messageBox.classList.add('hidden');
}

// Function to enable/disable reset button
function setResetButtonState(enabled) {
    if (enabled) {
        resetButton.disabled = false;
        resetButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        resetButton.disabled = true;
        resetButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Function to reset the application state
function resetApp() {
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height); // Clear canvas
    points = [];
    imageLoaded = false;
    img = new Image(); // Reset image object
    resultsDiv.classList.add('hidden');
    hideMessage();
    setResetButtonState(false);
    imageCanvas.removeEventListener('click', handleCanvasClick); // Remove listener to prevent accidental clicks
    imageCanvas.style.cursor = 'default'; // Reset cursor
    imageUpload.value = ''; // Clear file input
    showMessage("Upload an image to get started!", "info");
}

// Initialize app state
resetApp();

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.onload = () => {
                originalImageWidth = img.width;
                originalImageHeight = img.height;
                
                // Set canvas dimensions to match image, but scale down if too large
                const maxWidth = 800; // Max width for the canvas
                const maxHeight = 600; // Max height for the canvas
                let newWidth = originalImageWidth;
                let newHeight = originalImageHeight;

                if (newWidth > maxWidth) {
                    newHeight = (maxWidth / newWidth) * newHeight;
                    newWidth = maxWidth;
                }
                if (newHeight > maxHeight) {
                    newWidth = (maxHeight / newHeight) * newWidth;
                    newHeight = maxHeight;
                }

                imageCanvas.width = newWidth;
                imageCanvas.height = newHeight;
                
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                imageLoaded = true;
                points = []; // Reset points for new image
                resultsDiv.classList.add('hidden');
                showMessage("Image loaded! Click two points on the shoulder.", "info");
                setResetButtonState(true);
                imageCanvas.addEventListener('click', handleCanvasClick); // Add listener for clicks
                imageCanvas.style.cursor = 'crosshair'; // Set cursor for clicking
            };
            img.onerror = () => {
                showMessage("Error loading image. Please try a different file.", "error");
                imageLoaded = false;
                setResetButtonState(false);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        resetApp(); // Reset if no file selected
    }
});

function handleCanvasClick(event) {
    if (!imageLoaded) {
        showMessage("Please upload an image first.", "error");
        return;
    }

    // Get click coordinates relative to the canvas
    const rect = imageCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    points.push({ x, y });

    // Draw the point
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2); // Draw a circle
    ctx.fill();

    if (points.length === 2) {
        // Two points selected, calculate and draw line
        const p1 = points[0];
        const p2 = points[1];

        // Draw the line
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        calculateAndDisplayResults(p1, p2);
        imageCanvas.removeEventListener('click', handleCanvasClick); // Stop listening after 2 points
        imageCanvas.style.cursor = 'default'; // Reset cursor
        showMessage("Calculation complete. Click Reset to try again.", "info");
    } else if (points.length > 2) {
        // This shouldn't happen with the current logic, but as a safeguard
        showMessage("Too many points selected. Please reset and try again.", "error");
        resetApp();
    }
}

function calculateAndDisplayResults(point1, point2) {
    const deltaX = point2.x - point1.x;
    const deltaY = point2.y - point1.y; // Y increases downwards in canvas

    // Calculate angle in radians using atan2
    const angleRadians = Math.atan2(deltaY, deltaX);

    // Convert to degrees
    const angleDegrees = angleRadians * (180 / Math.PI);

    // Calculate trigonometric functions
    const sinAngle = Math.sin(angleRadians);
    const cosAngle = Math.cos(angleRadians);
    let tanAngle;
    if (Math.abs(deltaX) < 0.0001) { // Check for near-vertical line to avoid division by zero
        tanAngle = "Undefined (vertical line)";
    } else {
        tanAngle = Math.tan(angleRadians);
    }

    // Display results
    angleResult.textContent = angleDegrees.toFixed(2);
    sinResult.textContent = sinAngle.toFixed(4);
    cosResult.textContent = cosAngle.toFixed(4);
    tanResult.textContent = typeof tanAngle === 'number' ? tanAngle.toFixed(4) : tanAngle;
    resultsDiv.classList.remove('hidden');
}

resetButton.addEventListener('click', resetApp);

// Handle window resize to ensure canvas responsiveness (redraw image)
window.addEventListener('resize', () => {
    if (imageLoaded) {
        // Re-draw the image and points/line on resize
        const tempImgSrc = img.src; // Store current image source
        img = new Image(); // Create new image object
        img.onload = () => {
            const maxWidth = 800;
            const maxHeight = 600;
            let newWidth = originalImageWidth;
            let newHeight = originalImageHeight;

            if (newWidth > maxWidth) {
                newHeight = (maxWidth / newWidth) * newHeight;
                newWidth = maxWidth;
            }
            if (newHeight > maxHeight) {
                newWidth = (maxHeight / newHeight) * newWidth;
                newHeight = maxHeight;
            }

            imageCanvas.width = newWidth;
            imageCanvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Redraw points and line if they exist
            if (points.length > 0) {
                // Scale points to new canvas size
                const scaleX = newWidth / imageCanvas.width;
                const scaleY = newHeight / imageCanvas.height;

                const scaledPoints = points.map(p => ({
                    x: p.x * scaleX,
                    y: p.y * scaleY
                }));

                // Draw points
                ctx.fillStyle = 'blue';
                scaledPoints.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Draw line if two points are selected
                if (scaledPoints.length === 2) {
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
                    ctx.lineTo(scaledPoints[1].x, scaledPoints[1].y);
                    ctx.stroke();
                }
                // Update points to scaled ones for future calculations/redraws
                points = scaledPoints;
            }
        };
        img.src = tempImgSrc; // Reload image to trigger onload
    }
});
let slideIndex = 1;
let slideInterval;

function showSlides(n) {
    const slides = document.querySelectorAll(".slide");
    const dots = document.querySelectorAll(".dot");

    if (n > slides.length) slideIndex = 1;
    if (n < 1) slideIndex = slides.length;

    slides.forEach((slide, i) => {
        slide.classList.remove("active", "fade");
        slide.classList.add("hidden");
    });

    dots.forEach(dot => dot.classList.remove("active"));

    slides[slideIndex - 1].classList.add("active", "fade");
    slides[slideIndex - 1].classList.remove("hidden");
    dots[slideIndex - 1].classList.add("active");
}

function plusSlides(n) {
    clearInterval(slideInterval); // stop auto-play on manual nav
    showSlides(slideIndex += n);
    startAutoPlay(); // restart autoplay
}

function currentSlide(n) {
    clearInterval(slideInterval);
    showSlides(slideIndex = n);
    startAutoPlay();
}

function startAutoPlay() {
    slideInterval = setInterval(() => {
        plusSlides(1);
    }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    showSlides(slideIndex);
    startAutoPlay();
});

const carousel = document.getElementById('carousel');
const totalSlides = carousel.querySelectorAll('img').length;
let index = 0;

document.getElementById('nextBtn').addEventListener('click', () => {
  index = (index + 1) % totalSlides;
  updateSlide();
});

document.getElementById('prevBtn').addEventListener('click', () => {
  index = (index - 1 + totalSlides) % totalSlides;
  updateSlide();
});

function updateSlide() {
  carousel.style.transform = `translateX(-${index * 100}%)`;
}

// Optional autoplay
// setInterval(() => {
//   index = (index + 1) % totalSlides;
//   updateSlide();
// }, 4000);
