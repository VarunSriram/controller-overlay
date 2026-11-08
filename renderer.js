const statusEl = document.getElementById('status');
const wrapper = document.getElementById('scale-wrapper');

let currentScale = 1.0;
const SCALE_STEP = 0.1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;

const MAX_TRIGGER_VALUE = 255.0;      // OS max for analog triggers
const MAX_THUMBSTICK_VALUE = 32767.0; // OS max for 16-bit analog sticks
const DEADZONE_THRESHOLD = 0.15;      // Ignore stick drift below 15%

const STICK_MOVEMENT_PX = 20;         
const STICK_SHADOW_OFFSET_PX = 10;   
const STICK_SHADOW_MAX_OPACITY = 0.4; 
const TRIGGER_SQUISH_FACTOR = 0.1;   
const TRIGGER_TEXT_INVERT_THRESHOLD = 50;

// --- Windows XInput Bitmasks ---
const XINPUT = {
  DPAD_UP:    0x0001,
  DPAD_DOWN:  0x0002,
  DPAD_LEFT:  0x0004,
  DPAD_RIGHT: 0x0008,
  START:      0x0010,
  BACK:       0x0020,
  L3:         0x0040,
  R3:         0x0080,
  LB:         0x0100,
  RB:         0x0200,
  GUIDE:      0x0400,
  A:          0x1000,
  B:          0x2000,
  X:          0x4000,
  Y:          0x8000
};

function setScale(newScale) {
  if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;
  currentScale = newScale;
  wrapper.style.transform = `scale(${currentScale})`;
  window.electronAPI.setScale(currentScale);
}

document.getElementById('btn-minus').addEventListener('click', () => setScale(parseFloat((currentScale - SCALE_STEP).toFixed(1))));
document.getElementById('btn-plus').addEventListener('click', () => setScale(parseFloat((currentScale + SCALE_STEP).toFixed(1))));
document.getElementById('btn-close').addEventListener('click', () => window.electronAPI.closeApp());

const toggleBtn = (id, isActive) => {
  const el = document.getElementById(id);
  if (el) {
    if (isActive) el.classList.add('active');
    else el.classList.remove('active');
  }
};

const applyDeadzone = (val, threshold = DEADZONE_THRESHOLD) => Math.abs(val) < threshold ? 0 : val;

const updateTriggerVisuals = (id, percent) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.background = `linear-gradient(to top, #00ff00 ${percent}%, #333 ${percent}%)`;
  el.style.color = percent > TRIGGER_TEXT_INVERT_THRESHOLD ? '#000' : '#aaa';
  el.style.transform = `scale(${1.0 - (percent / 100 * TRIGGER_SQUISH_FACTOR)})`;
};

const updateThumbstickVisuals = (baseId, x, y, magnitude) => {
  const stickEl = document.getElementById(baseId);
  const areaEl = document.getElementById(`${baseId}-area`);
  if (!stickEl || !areaEl) return;
  
  stickEl.style.transform = `translate(${x * STICK_MOVEMENT_PX}px, ${y * STICK_MOVEMENT_PX}px)`;
  areaEl.style.boxShadow = `${x * STICK_SHADOW_OFFSET_PX}px ${y * STICK_SHADOW_OFFSET_PX}px 10px 0px rgba(0, 255, 0, ${magnitude * STICK_SHADOW_MAX_OPACITY})`;
};

window.electronAPI.onControllerData((event, pad) => {
  statusEl.innerText = ""; 
  const btn = pad.wButtons;
  
  // Digital Face & Shoulder Buttons
  toggleBtn('btn-12', (btn & XINPUT.DPAD_UP) !== 0); 
  toggleBtn('btn-13', (btn & XINPUT.DPAD_DOWN) !== 0); 
  toggleBtn('btn-14', (btn & XINPUT.DPAD_LEFT) !== 0); 
  toggleBtn('btn-15', (btn & XINPUT.DPAD_RIGHT) !== 0); 
  toggleBtn('btn-9',  (btn & XINPUT.START) !== 0); 
  toggleBtn('btn-8',  (btn & XINPUT.BACK) !== 0); 
  toggleBtn('stick-left',  (btn & XINPUT.L3) !== 0); 
  toggleBtn('stick-right', (btn & XINPUT.R3) !== 0); 
  toggleBtn('btn-4',  (btn & XINPUT.LB) !== 0); 
  toggleBtn('btn-5',  (btn & XINPUT.RB) !== 0); 
  toggleBtn('btn-16', (btn & XINPUT.GUIDE) !== 0); 
  toggleBtn('btn-0',  (btn & XINPUT.A) !== 0); 
  toggleBtn('btn-1',  (btn & XINPUT.B) !== 0); 
  toggleBtn('btn-2',  (btn & XINPUT.X) !== 0); 
  toggleBtn('btn-3',  (btn & XINPUT.Y) !== 0); 

 // Analog Triggers
  const ltPercent = (pad.bLeftTrigger / MAX_TRIGGER_VALUE) * 100;
  const rtPercent = (pad.bRightTrigger / MAX_TRIGGER_VALUE) * 100;

  updateTriggerVisuals('btn-6', ltPercent);
  updateTriggerVisuals('btn-7', rtPercent);

  // Left Analog Stick
  const lx = applyDeadzone(pad.sThumbLX / MAX_THUMBSTICK_VALUE);
  const ly = applyDeadzone(-pad.sThumbLY / MAX_THUMBSTICK_VALUE);
  const lMag = Math.min(Math.sqrt(lx*lx + ly*ly), 1.0);
  
  updateThumbstickVisuals('stick-left', lx, ly, lMag);

  // Right Analog Stick
  const rx = applyDeadzone(pad.sThumbRX / MAX_THUMBSTICK_VALUE);
  const ry = applyDeadzone(-pad.sThumbRY / MAX_THUMBSTICK_VALUE);
  const rMag = Math.min(Math.sqrt(rx*rx + ry*ry), 1.0);
  
  updateThumbstickVisuals('stick-right', rx, ry, rMag);
});