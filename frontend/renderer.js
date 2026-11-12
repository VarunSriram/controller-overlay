// Utility to toggle the .active class from your CSS
function toggleActive(id, condition) {
    const el = document.getElementById(id);
    if (el) {
        if (condition) el.classList.add('active');
        else el.classList.remove('active');
    }
}

// Utility to move the sticks inside their dark gray areas AND apply the subtle highlight
function moveStick(stickId, axisX, axisY) {
    const el = document.getElementById(stickId);
    const areaEl = document.getElementById(stickId + '-area'); // Grabs the outer boundary circle
    if (!el) return;
    
    // Normalize -32768 to 32767 into -1.0 to 1.0 (with a 5000 deadzone to stop drift)
    const deadzone = 5000;
    const percentX = Math.abs(axisX) < deadzone ? 0 : axisX / 32768; 
    let percentY = Math.abs(axisY) < deadzone ? 0 : axisY / 32768;
    percentY = percentY * -1; // Invert Y for screen coordinates
    
    // The stick area is 80px, stick is 40px. Max travel from center is ~20px.
    const travelLimit = 20; 
    
    // 1. Move the stick and shade its inner edge
    el.style.transform = `translate(${percentX * travelLimit}px, ${percentY * travelLimit}px)`;
    el.style.boxShadow = `inset ${percentX * 6}px ${percentY * 6}px 8px rgba(255, 255, 255, 0.6)`;

    // 2. Apply the outer directional glow to the boundary area
    if (areaEl) {
        // Calculate how far the stick is pushed (0.0 to 1.0) to control the glow opacity
        const intensity = Math.min(1, Math.sqrt(percentX * percentX + percentY * percentY));
        
        // Push a green shadow outward in the direction of the tilt
        areaEl.style.boxShadow = `${percentX * 5}px ${percentY * 5}px 8px rgba(0, 255, 0, ${intensity * 0.6})`;    }
}

// Rust injects data directly into this function at 60Hz
window.updateControllerData = function(data) {
    const status = document.getElementById('status');
    if (status && status.innerText !== "") {
        status.innerText = ""; // Hide the "Press any button" text on first input
    }

    // Face Buttons
    toggleActive('btn-0', (data.wButtons & 0x1000) !== 0); // A
    toggleActive('btn-1', (data.wButtons & 0x2000) !== 0); // B
    toggleActive('btn-2', (data.wButtons & 0x4000) !== 0); // X
    toggleActive('btn-3', (data.wButtons & 0x8000) !== 0); // Y

    // D-Pad
    toggleActive('btn-12', (data.wButtons & 0x0001) !== 0); // Up
    toggleActive('btn-13', (data.wButtons & 0x0002) !== 0); // Down
    toggleActive('btn-14', (data.wButtons & 0x0004) !== 0); // Left
    toggleActive('btn-15', (data.wButtons & 0x0008) !== 0); // Right

    // Shoulders
    toggleActive('btn-4', (data.wButtons & 0x0100) !== 0); // LB
    toggleActive('btn-5', (data.wButtons & 0x0200) !== 0); // RB

    // Analog Triggers (0-255 mapped to 0.0-1.0)
    const ltPercent = (data.bLeftTrigger / 255) * 100;
    const rtPercent = (data.bRightTrigger / 255) * 100;
    
    const ltEl = document.getElementById('btn-6');
    if (ltEl) ltEl.style.setProperty('--trigger-depth', `${ltPercent}%`);
    
    const rtEl = document.getElementById('btn-7');
    if (rtEl) rtEl.style.setProperty('--trigger-depth', `${rtPercent}%`);

    // Center Buttons (Note: XInput natively blocks the Xbox Guide button from being read)
    toggleActive('btn-8', (data.wButtons & 0x0020) !== 0); // View/Back
    toggleActive('btn-9', (data.wButtons & 0x0010) !== 0); // Menu/Start

    // Stick Clicks
    toggleActive('stick-left', (data.wButtons & 0x0040) !== 0);
    toggleActive('stick-right', (data.wButtons & 0x0080) !== 0);

    // Stick Movement & Highlights
    moveStick('stick-left', data.sThumbLX, data.sThumbLY);
    moveStick('stick-right', data.sThumbRX, data.sThumbRY);
};

// --- Custom UI Controls (Scale & Close) ---
let currentScale = 1.0;
const wrapper = document.getElementById('app-wrapper');
const scaleText = document.getElementById('scale-text');

document.getElementById('scale-up').addEventListener('click', () => {
    if (currentScale < 2.0) currentScale += 0.1;
    wrapper.style.transform = `scale(${currentScale})`;
    scaleText.innerText = `${Math.round(currentScale * 100)}%`;
});

document.getElementById('scale-down').addEventListener('click', () => {
    if (currentScale > 0.5) currentScale -= 0.1;
    wrapper.style.transform = `scale(${currentScale})`;
    scaleText.innerText = `${Math.round(currentScale * 100)}%`;
});

document.getElementById('close-app').addEventListener('click', () => {
    if (window.__TAURI__ && window.__TAURI__.app) {
        window.__TAURI__.app.exit(0);
    }
});