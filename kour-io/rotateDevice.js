// Check for device orientation and display the message accordingly
function checkOrientation() {
    var elem = document.getElementById("rotateMessage");
    if (elem === null)
        return;
    if (window.innerWidth > window.innerHeight) {
        // Landscape mode
        elem.style.display = "none";
    } else {
        // Portrait mode
        elem.style.display = "block";
    }
}

// Function to periodically check the orientation every 3 seconds
function periodicOrientationCheck() {
    checkOrientation();
}

// Check if the user agent indicates a mobile device
function isMobileDevice() {
    return /Mobi|iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0);
}

// Listen for orientation changes and initially check the orientation
window.addEventListener("resize", checkOrientation);
checkOrientation(); // Initially check the orientation

// Check if the device is a mobile device, and if so, use setInterval to repeatedly call periodicOrientationCheck every 3 seconds
if (isMobileDevice()) {
    setInterval(periodicOrientationCheck, 3000); // 3000 milliseconds (3 seconds)
}
else {
    //kill that message to save ram
    hideRotateMessage();
}
var btn = document.getElementById("usePortraitBtn");
if (btn !== null) {
    btn.addEventListener("touchstart", function (event) {
        hideRotateMessage();
        event.preventDefault(); // Prevents additional events like mouse events from firing
    }, { passive: false }); // This option is used to indicate that the event listener will call preventDefault to prevent scrolling and other default actions.
}
// Hide the rotate message and remove the element from the DOM
function hideRotateMessage() {
    var rotateElement = document.getElementById("rotateMessage");
    if (rotateElement) {
        rotateElement.remove();
    }
}
