
import * as THREE from 'three';
import { PORTFOLIO_FRAMES, renderPortfolioFrame } from './portfolio-frames.js';
import { FINE_ART } from './fine-art.js';

/* ─── Renderer & Atmosphere ─── */
const mobileQuality = matchMedia("(pointer:coarse)").matches || innerWidth < 760;
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !mobileQuality;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const BG_COLOR = 0x100e0c;
scene.background = new THREE.Color(BG_COLOR);
scene.fog = new THREE.Fog(BG_COLOR, 14, 38);

function framingFov() { return innerWidth < 700 ? Math.min(110, Math.max(70, 2 * Math.atan(3.55 / (7.6 * innerWidth / innerHeight)) * 180 / Math.PI)) : 70; }
const camera = new THREE.PerspectiveCamera(framingFov(), innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 1.7, 12.2);

/* ─── Unified Camera & Universal Controls Setup ─── */
const enterOverlay = document.getElementById('enter-overlay');
const enterBtn     = document.getElementById('enter-btn');

let isEntered = false;
let isPointerLocked = false;
let isMouseDown = false;
let prevMouseX = 0;
let prevMouseY = 0;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
camera.rotation.order = 'YXZ';
euler.setFromQuaternion(camera.quaternion);

// Pointer lock listeners
document.addEventListener('pointerlockchange', () => {
  isPointerLocked = (document.pointerLockElement === renderer.domElement || document.pointerLockElement === document.body);
  if (isPointerLocked) {
    document.body.classList.add('locked');
  }
});

document.addEventListener('pointerlockerror', () => {
  console.info('Pointer Lock API restricted or cancelled — drag-to-look is active.');
});

// Pointer / Mouse Look
function handleLookDelta(dx, dy, sensitivity = 0.0025) {
  euler.y -= dx * sensitivity;
  euler.x -= dy * sensitivity;
  euler.x = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, euler.x));
  camera.quaternion.setFromEuler(euler);
}

window.addEventListener('mousemove', (e) => {
  if (!isEntered || panelOpen) return;
  if (isPointerLocked) {
    handleLookDelta(e.movementX || 0, e.movementY || 0, 0.0024);
  } else if (isMouseDown) {
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    handleLookDelta(dx, dy, 0.003);
  }
});

// Touch / Mobile gesture support — drag the left stick to move and swipe elsewhere to look.
const joystick = document.getElementById('mobile-joystick');
const joystickKnob = document.getElementById('joystick-knob');
const mobileMove = { x: 0, y: 0 };
let joystickTouchId = null;
let lookTouchId = null;
let touchStartX = 0, touchStartY = 0;

function resetJoystick() {
  mobileMove.x = 0;
  mobileMove.y = 0;
  joystickKnob.style.transform = 'translate(-50%, -50%)';
}

function updateJoystick(touch) {
  const rect = joystick.getBoundingClientRect();
  const radius = rect.width * 0.3;
  let dx = touch.clientX - (rect.left + rect.width / 2);
  let dy = touch.clientY - (rect.top + rect.height / 2);
  const length = Math.hypot(dx, dy);
  if (length > radius) {
    dx = dx / length * radius;
    dy = dy / length * radius;
  }
  mobileMove.x = dx / radius;
  mobileMove.y = dy / radius;
  joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function bindAnalog(element, knob, output) {
  let active = null;
  const reset = () => { active = null; output.x = output.y = 0; knob.style.transform = 'translate(-50%,-50%)'; };
  const update = e => {
    const r = element.getBoundingClientRect(), radius = r.width * .3;
    let x = e.clientX-r.left-r.width/2, y = e.clientY-r.top-r.height/2;
    const length = Math.hypot(x,y);
    if(length > radius) { x *= radius/length; y *= radius/length; }
    output.x = Math.abs(x/radius) < .12 ? 0 : x/radius;
    output.y = Math.abs(y/radius) < .12 ? 0 : y/radius;
    knob.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
  };
  element.addEventListener('pointerdown', e => { if(panelOpen || !isEntered || active !== null) return; active=e.pointerId; element.setPointerCapture(active); update(e); e.preventDefault(); });
  element.addEventListener('pointermove', e => { if(active===e.pointerId) update(e); });
  for(const event of ['pointerup','pointercancel','lostpointercapture']) element.addEventListener(event, reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', reset);
  element.resetAnalog = reset;
}
bindAnalog(joystick,joystickKnob,mobileMove);
window.addEventListener('touchstart', (e) => {
  if (e.target !== renderer.domElement || !isEntered || panelOpen || lookTouchId !== null) return;
  const touch = [...e.changedTouches].find(t => t.identifier !== joystickTouchId);
  if (!touch) return;
  lookTouchId = touch.identifier;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!isEntered || panelOpen || lookTouchId === null) return;
  const touch = [...e.touches].find(t => t.identifier === lookTouchId);
  if (!touch) return;
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  handleLookDelta(dx, dy, 0.004);
  e.preventDefault();
}, { passive: false });

function releaseLookTouch(e) {
  if ([...e.changedTouches].some(t => t.identifier === lookTouchId)) lookTouchId = null;
}
window.addEventListener('touchend', releaseLookTouch, { passive: true });
window.addEventListener('touchcancel', releaseLookTouch, { passive: true });

renderer.domElement.addEventListener('mousedown', (e) => {
  if (!isEntered || panelOpen || e.button !== 0) return;
  isMouseDown = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isMouseDown = false;
});

export function enterGallery(e) {
  if (e) e.stopPropagation();
  isEntered = true;
  enterOverlay.classList.add('hidden');
  enterOverlay.style.display = 'none';
  document.body.classList.add('locked','in-gallery');
  document.querySelectorAll('#project-nav button').forEach(b => b.hidden=false);
  resetView();
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Interactive gallery. Use arrow keys to move. Featured project links are above.');
  renderer.domElement.focus();
  euler.setFromQuaternion(camera.quaternion);

  try {
    if (!matchMedia("(pointer:coarse)").matches && innerWidth > 700) renderer.domElement.requestPointerLock?.()?.catch(() => {});
  } catch(err) {}
}

function resetView() {
  camera.position.set(0, 1.7, 12.2);
  camera.lookAt(0, 2.1, 4.6);
  euler.setFromQuaternion(camera.quaternion);
}
document.getElementById('home-view').addEventListener('click', resetView);
document.getElementById('leave-gallery').addEventListener('click', () => {
  isEntered=false; document.exitPointerLock?.(); clearInput();
  document.body.classList.remove('locked','in-gallery');
  enterOverlay.style.display='flex'; enterOverlay.classList.remove('hidden'); enterBtn.focus();
});
window.addEventListener('blur',clearInput);
function clearInput() {
  Object.keys(keys).forEach(k => keys[k]=false);
  joystick.resetAnalog?.();
  isMouseDown=false; lookTouchId=null;
}
// Enter only through the explicit button or keyboard shortcut.

/* ─── Keyboard Input ─── */
const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!isEntered && (e.code === 'Space' || e.code === 'Enter') && !e.target.closest('a, button')) {
    enterGallery();
    return;
  }
  // Open artwork panel when E pressed and near a painting
  if (e.code === 'KeyE' && !e.repeat && isEntered && !panelOpen && nearestArtwork) {
    openArtworkPanel(nearestArtwork.data, nearestArtwork.texture);
  }
  // Close panel with Escape
  if (e.code === 'Escape' && panelOpen) {
    if (frameExhibitionModal.classList.contains('open')) closeFrameExhibition();
    else if (portfolioModal.classList.contains('open')) closePortfolio();
    else closeArtworkPanel();
  }
});
document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// A look gesture must never activate an exhibit when the pointer is released.
let artworkClick = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  artworkClick = isEntered && !panelOpen && e.button === 0 && e.isPrimary
    ? { id: e.pointerId, x: e.clientX, y: e.clientY, travel: 0, locked: isPointerLocked }
    : null;
});
window.addEventListener('pointermove', (e) => {
  if (!artworkClick || e.pointerId !== artworkClick.id) return;
  artworkClick.travel += artworkClick.locked
    ? Math.hypot(e.movementX || 0, e.movementY || 0)
    : Math.hypot(e.clientX - artworkClick.x, e.clientY - artworkClick.y);
  artworkClick.x = e.clientX;
  artworkClick.y = e.clientY;
});
window.addEventListener('pointercancel', () => { artworkClick = null; });
window.addEventListener('blur', () => { artworkClick = null; isMouseDown = false; });

// Only an intentional click/tap or a fresh E press opens content.
renderer.domElement.addEventListener('click', (e) => {
  const gesture = artworkClick;
  artworkClick = null;
  if (!isEntered || panelOpen || !gesture || gesture.travel > 6 || e.button !== 0) return;
  const bounds = renderer.domElement.getBoundingClientRect();
  const x = gesture.locked ? 0 : ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
  const y = gesture.locked ? 0 : -((e.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const hits = raycaster.intersectObjects(artMeshes.map(a => a.mesh), false);
  if (hits.length > 0) {
    const hit = artMeshes.find(a => a.mesh === hits[0].object);
    if (hit) openArtworkPanel(hit.data, hit.texture);
  }
});

/* ─── Room Dimensions & Physics ─── */
const SPEED = 8.5;
const BOUND = { minX: -7.5, maxX: 7.5, minZ: -12.5, maxZ: 12.5 };
const velocity = new THREE.Vector3();
let prevTime = performance.now();

const ROOM_W = 18;
const ROOM_L = 28;
const ROOM_H = 5.6;
const WALL_T = 0.3;

/* ─── Textures & Premium Materials ─── */
const textureLoader = new THREE.TextureLoader();
THREE.DefaultLoadingManager.onLoad = () => { renderer.shadowMap.needsUpdate = true; };

const wallTexture = textureLoader.load('./assets/museum-wall-broken-white.png');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(4, 2);
wallTexture.colorSpace = THREE.SRGBColorSpace;

const ceilTexture = textureLoader.load('./assets/museum-ceiling-lights.png');
ceilTexture.wrapS = THREE.RepeatWrapping;
ceilTexture.wrapT = THREE.RepeatWrapping;
ceilTexture.repeat.set(4, 6);
ceilTexture.colorSpace = THREE.SRGBColorSpace;

const floorTexture = textureLoader.load('./assets/museum-floor-gray.png');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(5, 8);
floorTexture.colorSpace = THREE.SRGBColorSpace;

const floorMat = new THREE.MeshStandardMaterial({
  map: floorTexture,
  color: 0xffffff,
  roughness: 0.58,
  metalness: 0.04
});

const wallMat = new THREE.MeshStandardMaterial({
  map: wallTexture,
  color: 0xffffff,
  roughness: 0.86,
  metalness: 0.0
});

const ceilMat = new THREE.MeshStandardMaterial({
  map: ceilTexture,
  color: 0xffffff,
  roughness: 0.9,
  metalness: 0.0
});

const panelMat = new THREE.MeshStandardMaterial({
  color: 0x1e1b18,
  roughness: 0.6,
  metalness: 0.1
});

const goldTrimMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.25,
  metalness: 0.9
});

const darkBronzeMat = new THREE.MeshStandardMaterial({
  color: 0x2c241a,
  roughness: 0.35,
  metalness: 0.8
});

const marblePedestalMat = new THREE.MeshStandardMaterial({
  color: 0x1f1d1b, // Dark Nero Marquina marble
  roughness: 0.18,
  metalness: 0.2
});

const portfolioAltarMat = new THREE.MeshStandardMaterial({
  color: 0xcfc0a3,
  roughness: 0.62,
  metalness: 0.02
});

const benchLeatherMat = new THREE.MeshStandardMaterial({
  color: 0x241d17,
  roughness: 0.45,
  metalness: 0.1
});

const benchWoodMat = new THREE.MeshStandardMaterial({
  color: 0x1a1512,
  roughness: 0.3,
  metalness: 0.1
});

/* ─── Geometry Helper ─── */
function box(w, h, d, mat, x, y, z, ry = 0, cs = true, rs = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = cs;
  m.receiveShadow = rs;
  scene.add(m);
  return m;
}

/* ─── Single Room Architecture ─── */
// Floor & Ceiling
box(ROOM_W, WALL_T, ROOM_L, floorMat, 0, 0, 0, 0, false, true);
box(ROOM_W, WALL_T, ROOM_L, ceilMat, 0, ROOM_H, 0, 0, false, false);

// Perimeter Walls (Single open hall)
box(ROOM_W, ROOM_H, WALL_T, wallMat, 0, ROOM_H / 2, -ROOM_L / 2); // Back
box(ROOM_W, ROOM_H, WALL_T, wallMat, 0, ROOM_H / 2,  ROOM_L / 2); // Front
box(WALL_T, ROOM_H, ROOM_L, wallMat, -ROOM_W / 2, ROOM_H / 2, 0); // Left
box(WALL_T, ROOM_H, ROOM_L, wallMat,  ROOM_W / 2, ROOM_H / 2, 0); // Right

// Baseboards & Crown Moldings (Dark bronze architectural trim)
const TRIM_H = 0.25;
box(ROOM_W, TRIM_H, 0.08, darkBronzeMat, 0, TRIM_H / 2, -ROOM_L / 2 + 0.1);
box(ROOM_W, TRIM_H, 0.08, darkBronzeMat, 0, TRIM_H / 2,  ROOM_L / 2 - 0.1);
box(0.08, TRIM_H, ROOM_L, darkBronzeMat, -ROOM_W / 2 + 0.1, TRIM_H / 2, 0);
box(0.08, TRIM_H, ROOM_L, darkBronzeMat,  ROOM_W / 2 - 0.1, TRIM_H / 2, 0);

// Ceiling perimeter light troughs
box(ROOM_W - 1, 0.08, 0.3, darkBronzeMat, 0, ROOM_H - 0.05, -ROOM_L / 2 + 1);
box(ROOM_W - 1, 0.08, 0.3, darkBronzeMat, 0, ROOM_H - 0.05,  ROOM_L / 2 - 1);
box(0.3, 0.08, ROOM_L - 1, darkBronzeMat, -ROOM_W / 2 + 1, ROOM_H - 0.05, 0);
box(0.3, 0.08, ROOM_L - 1, darkBronzeMat,  ROOM_W / 2 - 1, ROOM_H - 0.05, 0);

/* ─── Procedural Generative Artworks & Frames ─── */
function createArtworkCanvas(type, width = 512, height = 384) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (type === 'gold-abstract') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#151311');
    grad.addColorStop(0.5, '#2e2417');
    grad.addColorStop(1, '#0f0e0c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#dfb86a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(width * 0.4 + i * 20, height * 0.5, 60 + i * 15, 0, Math.PI * 2);
      ctx.globalAlpha = 0.4 + i * 0.08;
      ctx.stroke();
    }
  } else if (type === 'minimal-geo') {
    ctx.fillStyle = '#171a1d';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#3a5f8a';
    ctx.beginPath();
    ctx.arc(width * 0.65, height * 0.45, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c59d5f';
    ctx.fillRect(width * 0.2, height * 0.3, 160, 160);

    ctx.strokeStyle = '#e6c88b';
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.25, height * 0.25, 180, 180);
  } else if (type === 'cyber-amber') {
    const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, 200);
    grad.addColorStop(0, '#d68b35');
    grad.addColorStop(0.5, '#4a250a');
    grad.addColorStop(1, '#110b06');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#ffc078';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(width - x, height);
      ctx.globalAlpha = 0.25;
      ctx.stroke();
    }
  } else {
    // Ethereal Monochrome
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#2b2a28');
    grad.addColorStop(0.5, '#403d38');
    grad.addColorStop(1, '#121110');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#decab0';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.55, 120, 70, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createDisplayTexture(title, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#16120e');
  grad.addColorStop(1, '#090807');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(28, 28, 456, 456);
  ctx.fillStyle = accent;
  ctx.fillRect(78, 138, 48, 3);
  ctx.font = '22px Arial';
  ctx.fillText('PORTFOLIO PROJECT', 78, 110);
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  title.toUpperCase().split(' ').forEach((word, index) => ctx.fillText(word, 256, 235 + index * 68));
  ctx.font = '18px Arial';
  ctx.fillStyle = '#e8dcc7';
  ctx.fillText('OPEN PORTFOLIO  ↗', 256, 408);
  ctx.textAlign = 'left';
  return new THREE.CanvasTexture(canvas);
}

function createPortfolioFrameTexture(frame) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 620;
  const ctx = canvas.getContext('2d');
  const draw = (image) => {
    ctx.fillStyle = frame.id === 'art-technology' ? '#262126' : '#e9e2d5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (image) {
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
      const w = image.width * scale, h = image.height * scale;
      ctx.globalAlpha = 0.38;
      ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = frame.id === 'art-technology' ? 'rgba(30,25,30,.55)' : 'rgba(247,243,235,.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = frame.id === 'art-technology' ? '#e6b894' : '#8b7159';
    ctx.lineWidth = 5;
    ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);
    ctx.fillStyle = frame.id === 'art-technology' ? '#f8eee2' : '#342d25';
    ctx.font = 'bold 21px Arial';
    ctx.letterSpacing = '4px';
    ctx.fillText(frame.status, 80, 102);
    ctx.font = '48px Georgia';
    ctx.textAlign = 'center';
    const words = frame.title.split(' ');
    words.forEach((word, i) => ctx.fillText(word, canvas.width / 2, 275 + i * 58));
    ctx.font = '20px Arial';
    ctx.fillText(frame.subtitle, canvas.width / 2, 470);
    ctx.font = 'bold 16px Arial';
    ctx.fillText('ENTER EXHIBITION  ↗', canvas.width / 2, 535);
    ctx.textAlign = 'left';
  };
  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const image = new Image();
  image.onload = () => { draw(image); texture.needsUpdate = true; };
  if (frame.image && !frame.image.includes('assets/portfolio/')) image.src = frame.image;
  return texture;
}

function loadProjectPreview(path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function loadVideoPoster(path) {
  const texture = loadProjectPreview(path);
  // YouTube serves a 16:9 image with the vertical Short centered inside it.
  // Crop its side bars using UVs, retaining the source image resolution.
  texture.repeat.set((9 / 16) / (16 / 9), 1);
  texture.offset.set((1 - texture.repeat.x) / 2, 0);
  return texture;
}

function createAltarPlaqueTexture(title) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e9dfcc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#736754';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = '#342e25';
  ctx.font = '600 42px Arial';
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.toUpperCase(), canvas.width / 2, canvas.height / 2 + 2, canvas.width - 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const pedestalDisplays = [
  { id: 'bines-academy', title: 'Bines Academy', artist: 'Bines Academy', year: '2026', medium: 'Interactive portfolio display', badge: 'Featured Portfolio', desc: 'Open the Bines Academy portfolio to explore this featured project.', actionLabel: 'Open portfolio', isPortfolio: true, preview: './assets/projects/bines-video-thumbnail.jpg', texture: loadVideoPoster('./assets/projects/bines-video-thumbnail.jpg') },
  { id: 'acnematch', title: 'Acne Camz', artist: 'Rubin Danely', year: '2026', medium: 'Interactive portfolio display', badge: 'Featured Portfolio', desc: 'Open the Acnematch portfolio to explore this featured project.', actionLabel: 'Open portfolio', isPortfolio: true, preview: './assets/projects/acnecamz-video-thumbnail.jpg', texture: loadVideoPoster('./assets/projects/acnecamz-video-thumbnail.jpg') }
];

const portfolioFrameDisplays = PORTFOLIO_FRAMES.map(frame => ({
  ...frame,
  isExhibition: true,
  actionLabel: 'Enter exhibition',
  badge: frame.status,
  artist: 'Rubin Danely',
  year: '—',
  medium: 'Interactive portfolio exhibition',
  desc: frame.intro,
  texture: createPortfolioFrameTexture(frame)
}));

/* ─── Artwork metadata catalogue ─── */
const ARTWORKS = [
  { id:'opus-i',       title:'Opus I',           artist:'Elara Voss',     year:'2021', medium:'Oil on linen',       badge:'Abstract Expressionism', desc:'A meditative exploration of concentric tension. Voss layers translucent gold leaf over raw linen, building depth through repetition — each ring a breath held and released. First exhibited at the Venice Biennale.', texture: 'gold' },
  { id:'comp-ii',      title:'Composition II',   artist:'Jin Hao Park',   year:'2019', medium:'Acrylic & resin',    badge:'Contemporary Minimalism',  desc:'Geometric planes intersect at precisely calculated angles, dissolving the boundary between painting and architecture. Park invites the viewer to complete the composition through their movement and gaze.', texture: 'geo' },
  { id:'resonance',   title:'Resonance III',    artist:'Amara Ndiaye',   year:'2022', medium:'Digital & Pigment',  badge:'Neo-Symbolism',            desc:'Ndiaye merges traditional Wolof weaving patterns with digital interference, creating a visual frequency that shifts as you approach. The amber glow evokes Dakar street light at dusk.', texture: 'amber' },
  { id:'nocturne',    title:'Nocturne IV',      artist:'Sven Larsson',   year:'2020', medium:'Charcoal & graphite',badge:'Dark Romanticism',          desc:'Rendered entirely in monochrome, Larsson captures the vulnerable geometry of the sleeping form. The ellipse at center breathes — a study in the poetry of restraint and shadow.', texture: 'mono' },
  { id:'symphony',    title:'Symphony V',       artist:'Celia Moreau',   year:'2023', medium:'Encaustic wax',      badge:'Tactile Abstraction',      desc:'Built up in dozens of layers of heated wax, each chord of the symphony corresponds to a physical stratum. You are invited to run your eye across its topography as you would a musical score.', texture: 'mono' },
  { id:'aura',        title:'Aura VI',          artist:'Amara Ndiaye',   year:'2021', medium:'Digital & Pigment',  badge:'Neo-Symbolism',            desc:'A companion piece to Resonance III. Here the amber diffuses into copper and rust — the residue of a city\'s warmth after the crowd has thinned and the streets exhale.', texture: 'amber' },
  { id:'continuum',   title:'Continuum VII',    artist:'Jin Hao Park',   year:'2022', medium:'Acrylic & resin',    badge:'Contemporary Minimalism',  desc:'Park dissolves the grid. Circles intrude upon the geometric order, suggesting the persistence of organic life within structured systems. A meditation on entropy and design.', texture: 'geo' },
  { id:'genesis',     title:'Genesis VIII',     artist:'Elara Voss',     year:'2018', medium:'Oil on linen',       badge:'Abstract Expressionism',   desc:'The earliest work in this collection — the seed from which Voss\'s language grew. Raw, urgent, and already certain: golden spirals push through the dark ground with unmistakable force.', texture: 'gold' },
];

/* ─── Raycasting & Interaction ─── */
const raycaster = new THREE.Raycaster();
const artMeshes = []; // { mesh, worldPos, data }

const proximityPrompt  = document.getElementById('proximity-prompt');
const artworkPanel     = document.getElementById('artwork-panel');
const apCloseBtn       = document.getElementById('ap-close-btn');
const apFullpageBtn    = document.getElementById('ap-fullpage-btn');
const apTitle          = document.getElementById('ap-title');
const apArtist         = document.getElementById('ap-artist');
const apYear           = document.getElementById('ap-year');
const apMedium         = document.getElementById('ap-medium');
const apDesc           = document.getElementById('ap-desc');
const apBadge          = document.getElementById('ap-badge');
const apCanvasCont     = document.getElementById('ap-canvas-container');
const portfolioModal   = document.getElementById('portfolio-modal');
const portfolioFrame   = document.getElementById('portfolio-frame');
const portfolioClose   = document.getElementById('portfolio-close');
const frameExhibitionModal = document.getElementById('frame-exhibition-modal');

let panelOpen = false;
let nearestArtwork = null;
const INTERACT_DIST = 5.0;

function openArtworkPanel(data, texture) {
  if (data.isExhibition) {
    panelOpen = true;
    frameExhibitionModal.innerHTML = renderPortfolioFrame(data);
    clearInput(); frameExhibitionModal.showModal(); frameExhibitionModal.classList.add('open');
    frameExhibitionModal.querySelector('.stage-action')?.addEventListener('click', () => {
      frameExhibitionModal.querySelector('.frame-stage')?.classList.toggle('is-active');
    });
    frameExhibitionModal.querySelectorAll('.frame-questions p').forEach(question => {
      question.addEventListener('click', () => question.classList.toggle('is-selected'));
    });
    document.exitPointerLock?.();
    return;
  }
  if (data.isPortfolio || data.isFineArt) {
    panelOpen = true;
    portfolioFrame.src = `${data.isFineArt ? "artwork.html" : "portfolio.html"}?id=${data.id}`;
    clearInput(); portfolioModal.showModal(); portfolioModal.classList.add('open');
    document.exitPointerLock?.();
    return;
  }

  panelOpen = true;
  apTitle.textContent   = data.title;
  apArtist.textContent  = data.artist;
  apYear.textContent    = data.year;
  apMedium.textContent  = data.medium;
  apDesc.textContent    = data.desc;
  apBadge.textContent   = data.badge;

  // Build a standalone full-page URL for this artwork
  apFullpageBtn.href = `${data.isPortfolio ? 'portfolio.html' : 'artwork.html'}?id=${data.id}`;
  apFullpageBtn.textContent = data.actionLabel ? `↗ ${data.actionLabel}` : '↗ More information';

  // Mirror the canvas texture into the panel preview
  apCanvasCont.innerHTML = '';
  if (texture && texture.image) {
    const img = document.createElement('img');
    img.src = texture.image.toDataURL ? texture.image.toDataURL() : (texture.image.currentSrc || texture.image.src || data.preview || '');
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    apCanvasCont.appendChild(img);
  }

  clearInput(); artworkPanel.showModal(); artworkPanel.classList.add('open');
  document.exitPointerLock?.();
}

function closeArtworkPanel() {
  panelOpen = false;
  artworkPanel.close(); artworkPanel.classList.remove('open');
}

function closePortfolio() {
  panelOpen = false;
  portfolioModal.close(); portfolioModal.classList.remove('open');
  portfolioFrame.src = '';
}

function closeFrameExhibition() {
  panelOpen = false;
  frameExhibitionModal.close(); frameExhibitionModal.classList.remove('open');
  frameExhibitionModal.innerHTML = '';
}

for (const modal of [artworkPanel,portfolioModal,frameExhibitionModal]) {
  modal.addEventListener('cancel', e => { e.preventDefault(); closeActivePanel(); });
}
function closeActivePanel() {
  if(portfolioModal.open) closePortfolio();
  else if(frameExhibitionModal.open) closeFrameExhibition();
  else if(artworkPanel.open) closeArtworkPanel();
}
window.addEventListener('message', event => {
  if(event.origin === location.origin && event.source === portfolioFrame.contentWindow && event.data === 'close-gallery-panel') closeActivePanel();
});
document.querySelectorAll('#project-nav a').forEach(link => link.addEventListener('click', event => {
  if(!isEntered) return;
  event.preventDefault();
  const id = new URL(link.href).searchParams.get('id');
  openArtworkPanel(pedestalDisplays.find(p => p.id === id));
}));
apCloseBtn.addEventListener('click', closeArtworkPanel);
artworkPanel.addEventListener('click', (e) => { if (e.target === artworkPanel) closeArtworkPanel(); });
portfolioClose.addEventListener('click', closePortfolio);
portfolioModal.addEventListener('click', (e) => { if (e.target === portfolioModal) closePortfolio(); });
frameExhibitionModal.addEventListener('click', (e) => {
  if (e.target === frameExhibitionModal || e.target.closest('.frame-close')) closeFrameExhibition();
});

/* ─── Wall Art Exhibition Frames ─── */
function createWallExhibition(x, z, w, h, rotationY, artTexture, artData) {
  const group = new THREE.Group();

  // Dark backing panel
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.4, h + 0.4, 0.08),
    panelMat
  );
  group.add(backPanel);

  // Gilded / Bronze outer frame
  const frameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.15, h + 0.15, 0.09),
    goldTrimMat
  );
  group.add(frameMesh);

  // Canvas painting
  const artMat = new THREE.MeshStandardMaterial({
    map: artTexture,
    roughness: 0.35,
    metalness: 0.1,
    emissive: 0xffffff,
    emissiveMap: artTexture,
    emissiveIntensity: 0.12
  });
  const artMesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.1),
    artMat
  );
  artMesh.userData.artData = artData;
  artMesh.userData.artTexture = artTexture;
  group.add(artMesh);

  // Wall Plaque
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(artData.isFineArt ? 1.9 : 0.5, artData.isFineArt ? 0.36 : 0.15, 0.03),
    artData.isFineArt ? new THREE.MeshBasicMaterial({ map: createAltarPlaqueTexture(artData.title) }) : goldTrimMat
  );
  plaque.position.set(0, -h / 2 - 0.3, 0.04);
  group.add(plaque);

  group.position.set(x, ROOM_H / 2, z);
  group.rotation.y = rotationY;
  scene.add(group);

  // Register for raycasting — store world position for proximity check
  artMeshes.push({ mesh: artMesh, group, data: artData, texture: artTexture });
  return artMesh;
}

// Five portfolio exhibitions — three frames on left wall, two on right wall
createWallExhibition(-8.8,  7.5, 3.2, 2.2, Math.PI / 2,  portfolioFrameDisplays[0].texture, portfolioFrameDisplays[0]);
createWallExhibition(-8.8,  0.0, 3.2, 2.2, Math.PI / 2,  portfolioFrameDisplays[1].texture, portfolioFrameDisplays[1]);
createWallExhibition(-8.8, -7.5, 3.2, 2.2, Math.PI / 2,  portfolioFrameDisplays[2].texture, portfolioFrameDisplays[2]);

createWallExhibition( 8.8,  4.2, 3.2, 2.2, -Math.PI / 2, portfolioFrameDisplays[3].texture, portfolioFrameDisplays[3]);
createWallExhibition( 8.8, -4.2, 3.2, 2.2, -Math.PI / 2, portfolioFrameDisplays[4].texture, portfolioFrameDisplays[4]);

// Collection title above the fine-art canvases.
const fineArtTitleCanvas = document.createElement('canvas');
fineArtTitleCanvas.width = 1024;
fineArtTitleCanvas.height = 256;
const fineArtTitleContext = fineArtTitleCanvas.getContext('2d');
fineArtTitleContext.fillStyle = '#342e25';
fineArtTitleContext.font = '400 140px Georgia';
fineArtTitleContext.textAlign = 'center';
fineArtTitleContext.textBaseline = 'middle';
fineArtTitleContext.fillText('my art', 512, 128);
const fineArtTitleTexture = new THREE.CanvasTexture(fineArtTitleCanvas);
fineArtTitleTexture.colorSpace = THREE.SRGBColorSpace;
const fineArtTitle = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 0.8),
  new THREE.MeshBasicMaterial({ map: fineArtTitleTexture, transparent: true })
);
fineArtTitle.position.set(0, 3.85, -13.7);
scene.add(fineArtTitle);

// Small fine-art canvases on the back wall, facing into the room.
FINE_ART.forEach((art, index) => {
  const height = 1.7;
  const texture = loadProjectPreview(art.preview);
  const canvas = createWallExhibition((index - 2.5) * 1.65, -13.8,
    height * art.width / art.height, height, 0, texture, art);
  canvas.parent.scale.setScalar(0.6);
  canvas.parent.position.y = 2.5;
});

/* ─── Central Portfolio Altars & Gallery Seating ─── */
function createPortfolioAltar(x, z, display) {
  const group = new THREE.Group();

  const pBase = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.22, 1.35), portfolioAltarMat);
  pBase.position.y = 0.11;
  group.add(pBase);

  const pShaft = new THREE.Mesh(new THREE.BoxGeometry(2.48, 1.15, 0.98), portfolioAltarMat);
  pShaft.position.y = 0.795;
  pShaft.castShadow = true;
  group.add(pShaft);

  const pTop = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.08, 1.1), portfolioAltarMat);
  pTop.position.y = 1.41;
  group.add(pTop);

  const plaqueMat = new THREE.MeshBasicMaterial({ map: createAltarPlaqueTexture(display.title === 'Acnematch' ? 'Acne Camz' : display.title) });
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.38, 0.025), plaqueMat);
  plaque.position.set(0, 0.83, 0.505);
  group.add(plaque);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.69, 2.85, 0.12), goldTrimMat);
  frame.position.set(0, 2.82, 0);
  group.add(frame);

  const displayMat = new THREE.MeshStandardMaterial({
    map: display.texture,
    emissive: 0xffffff,
    emissiveMap: display.texture,
    emissiveIntensity: 0.18,
    roughness: 0.35
  });
  const displayMesh = new THREE.Mesh(new THREE.BoxGeometry(1.49, 2.65, 0.14), displayMat);
  displayMesh.position.set(0, 2.82, 0.08);
  displayMesh.userData.artData = display;
  displayMesh.userData.artTexture = display.texture;
  group.add(displayMesh);

  group.position.set(x, 0, z);
  scene.add(group);
  artMeshes.push({ mesh: displayMesh, group, data: display, texture: display.texture });
}

createPortfolioAltar(-1.65, 4.6, pedestalDisplays[0]);
createPortfolioAltar( 1.65, 4.6, pedestalDisplays[1]);

// Central Luxury Gallery Bench (At Z = -0.5)
function createGalleryBench(x, z) {
  const group = new THREE.Group();
  // Walnut frame
  const woodBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1.2), benchWoodMat);
  woodBase.position.y = 0.38;
  woodBase.castShadow = true;
  group.add(woodBase);

  // Bronze legs
  const legMat = darkBronzeMat;
  [[-1.6, -0.45], [1.6, -0.45], [-1.6, 0.45], [1.6, 0.45]].forEach(lp => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.38, 12), legMat);
    leg.position.set(lp[0], 0.19, lp[1]);
    leg.castShadow = true;
    group.add(leg);
  });

  // Dark leather cushion
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 1.0), benchLeatherMat);
  cushion.position.y = 0.52;
  cushion.castShadow = true;
  group.add(cushion);

  group.position.set(x, 0, z);
  scene.add(group);
}
createGalleryBench(0, -0.5);

/* ─── Atmospheric Moody Lighting ─── */
// Museum ambient — enough to reveal textures, still moody
const ambientLight = new THREE.AmbientLight(0xfff0d8, 1.05);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xc8a870, 0x3a2e20, 0.55);
scene.add(hemiLight);

// Museum Precision Spotlights
function addSpotlight(color, intensity, sx, sz, tx, ty, tz, angle = Math.PI / 6.5) {
  const spot = new THREE.SpotLight(color, intensity, 16, angle, 0.55, 1.6);
  spot.position.set(sx, ROOM_H - 0.2, sz);
  spot.castShadow = !mobileQuality;
  spot.shadow.mapSize.set(512, 512);
  spot.shadow.bias = -0.001;

  const target = new THREE.Object3D();
  target.position.set(tx, ty, tz);
  scene.add(target);
  spot.target = target;
  scene.add(spot);

  // Ceiling track light fixture mesh
  const fixture = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.22, 12),
    darkBronzeMat
  );
  fixture.position.set(sx, ROOM_H - 0.12, sz);
  scene.add(fixture);
}

// Spotlights on the five wall exhibition frames
[
  [-4.5,  7.5, -8.7, ROOM_H / 2,  7.5],
  [-4.5,  0.0, -8.7, ROOM_H / 2,  0.0],
  [-4.5, -7.5, -8.7, ROOM_H / 2, -7.5],
  [ 4.5,  4.2,  8.7, ROOM_H / 2,  4.2],
  [ 4.5, -4.2,  8.7, ROOM_H / 2, -4.2]
].forEach(c => addSpotlight(0xfff0da, 3.8, c[0], c[1], c[2], c[3], c[4]));

// Dedicated spotlights on the portfolio altars
addSpotlight(0xffdfa0, 4.3, -1.65, 4.6, -1.65, 2.74, 4.6, Math.PI / 7);
addSpotlight(0xd0e4ff, 4.1,  1.65, 4.6,  1.65, 2.74, 4.6, Math.PI / 7);

// Soft Warm Center Fill Light
const centerWarmGlow = new THREE.PointLight(0xffdfaa, 0.8, 14, 2);
centerWarmGlow.position.set(0, 3.5, -0.5);
scene.add(centerWarmGlow);

/* ─── Ceiling Lighting Rails / Tracks ─── */
[-4.5, 4.5].forEach(x => {
  box(0.06, 0.06, ROOM_L - 4, darkBronzeMat, x, ROOM_H - 0.05, 0, 0, false, false);
});
[5.5, -0.5, -6.5].forEach(z => {
  box(6, 0.06, 0.06, darkBronzeMat, 0, ROOM_H - 0.05, z, 0, false, false);
});

/* ─── Resize ─── */
window.addEventListener('resize', () => {
  renderer.setPixelRatio(devicePixelRatio);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = framingFov();
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ─── Animation loop ─── */
function animate() {
  requestAnimationFrame(animate);
  if (!isEntered || panelOpen || document.hidden) { prevTime = performance.now(); return; }
  const now = performance.now();
  const dt  = Math.min((now - prevTime) / 1000, 0.1);
  prevTime = now;

  if (isEntered && !panelOpen) {
    velocity.x -= velocity.x * 10 * dt;
    velocity.z -= velocity.z * 10 * dt;

    const moveZ = Number(!!(keys['KeyW'] || keys['ArrowUp'])) - Number(!!(keys['KeyS'] || keys['ArrowDown'])) - mobileMove.y;
    const moveX = Number(!!(keys['KeyD'] || keys['ArrowRight'])) - Number(!!(keys['KeyA'] || keys['ArrowLeft'])) + mobileMove.x;

    if (moveZ !== 0 || moveX !== 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.y);
      const right   = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.y);

      const moveVec = new THREE.Vector3()
        .addScaledVector(forward, moveZ)
        .addScaledVector(right, moveX)
        .clampLength(0, 1);

      velocity.x = moveVec.x * SPEED;
      velocity.z = moveVec.z * SPEED;

      camera.position.x += velocity.x * dt;
      camera.position.z += velocity.z * dt;
    }

    // Clamp within unified room boundaries
    camera.position.x = Math.max(BOUND.minX, Math.min(BOUND.maxX, camera.position.x));
    camera.position.z = Math.max(BOUND.minZ, Math.min(BOUND.maxZ, camera.position.z));
    camera.position.y = 1.7;
  }

  // Proximity check — find closest artwork within INTERACT_DIST
  if (isEntered && !panelOpen) {
    let closest = null;
    let closestDist = INTERACT_DIST;
    artMeshes.forEach(art => {
      const wp = new THREE.Vector3();
      art.mesh.getWorldPosition(wp);
      const d = camera.position.distanceTo(wp);
      if (d < closestDist) { closestDist = d; closest = art; }
    });
    nearestArtwork = closest;
    if (closest && proximityPrompt.dataset.artwork !== closest.data.id) {
      proximityPrompt.dataset.artwork = closest.data.id;
      proximityPrompt.innerHTML = `<span class="pk">E</span> ${closest.data.actionLabel || 'View artwork'}`;
      proximityPrompt.classList.add('visible');
    } else if (!closest) {
      delete proximityPrompt.dataset.artwork;
      proximityPrompt.classList.remove('visible');
    }
  } else {
    proximityPrompt.classList.remove('visible');
  }

  if (isEntered && !panelOpen && !document.hidden) renderer.render(scene, camera);
}
animate();
