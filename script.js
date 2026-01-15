/* =================================================
   THREE.JS (ES MODULES)
================================================= */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("bg");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

/* Controls */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 6;

/* Lights */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(5, 0, 5);
scene.add(sunLight);

/* Earth */
const loader = new THREE.TextureLoader();

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({
    map: loader.load(
      "https://raw.githubusercontent.com/visualizedata/threear/examples/images/earthmap1k.jpg"
    ),
    emissiveMap: loader.load(
      "https://raw.githubusercontent.com/visualizedata/threear/examples/images/earthlights1k.jpg"
    ),
    emissiveIntensity: 0.5
  })
);

scene.add(earth);

/* Animation loop */
function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.0004;
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* Resize */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =================================================
   WARFRAME DAY / NIGHT TIMER
================================================= */

const timeNowEl = document.getElementById("timeNow");
const phaseEl = document.getElementById("phase");
const nextChangeEl = document.getElementById("nextChange");
const sourceEl = document.getElementById("source");

/* API Sources */
const SOURCES = [
  {
    name: "WarframeStat API",
    url: "https://api.warframestat.us/pc/cetusCycle",
    parser: data => ({
      isDay: data.isDay,
      expiry: new Date(data.expiry)
    })
  }
];

/* Local fallback */
const CYCLE_MS = 8 * 60 * 1000;
const DAY_MS = 4 * 60 * 1000;
const REFERENCE = new Date("2024-01-01T00:00:00Z").getTime();

function localCycle() {
  const now = Date.now();
  const elapsed = (now - REFERENCE) % CYCLE_MS;
  const isDay = elapsed < DAY_MS;
  const remaining = (isDay ? DAY_MS : CYCLE_MS) - elapsed;

  return {
    isDay,
    expiry: new Date(now + remaining),
    source: "Local Calculation"
  };
}

async function fetchCycleData() {
  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, { cache: "no-store" });
      const data = await res.json();
      const parsed = source.parser(data);
      return { ...parsed, source: source.name };
    } catch {
      continue;
    }
  }
  return localCycle();
}

/* UI update */
async function updateUI() {
  const now = new Date();
  timeNowEl.textContent =
    "Current Time: " + now.toLocaleTimeString("en-US");

  const cycle = await fetchCycleData();
  const diff = cycle.expiry - now;

  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  phaseEl.textContent =
    "Current Phase: " + (cycle.isDay ? "Day" : "Night");

  nextChangeEl.textContent =
    `Next Change In: ${mins}m ${secs}s`;

  sourceEl.textContent =
    "Source: " + cycle.source;

  /* Lighting sync */
  sunLight.intensity = cycle.isDay ? 1.2 : 0.2;
  earth.material.emissiveIntensity = cycle.isDay ? 0.2 : 0.9;
}

updateUI();
setInterval(updateUI, 1000);
