/* ===============================
   IMPORTS — ONLY CDN URLS
================================ */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js";

/* ===============================
   THREE.JS SETUP
================================ */

const canvas = document.getElementById("bg");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 6;

/* Lights */
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(5, 0, 5);
scene.add(sunLight);

/* Earth */
const loader = new THREE.TextureLoader();

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({
    map: loader.load("https://raw.githubusercontent.com/visualizedata/threear/examples/images/earthmap1k.jpg"),
    emissiveMap: loader.load("https://raw.githubusercontent.com/visualizedata/threear/examples/images/earthlights1k.jpg"),
    emissiveIntensity: 0.5
  })
);

scene.add(earth);

/* Animation */
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

/* ===============================
   WARFRAME TIMER
================================ */

const timeNowEl = document.getElementById("timeNow");
const phaseEl = document.getElementById("phase");
const nextChangeEl = document.getElementById("nextChange");
const sourceEl = document.getElementById("source");

const API = "https://api.warframestat.us/pc/cetusCycle";

const CYCLE_MS = 8 * 60 * 1000;
const DAY_MS = 4 * 60 * 1000;
const REF = new Date("2024-01-01T00:00:00Z").getTime();

function localCycle() {
  const now = Date.now();
  const elapsed = (now - REF) % CYCLE_MS;
  const isDay = elapsed < DAY_MS;
  return {
    isDay,
    expiry: new Date(now + ((isDay ? DAY_MS : CYCLE_MS) - elapsed)),
    source: "Local Calculation"
  };
}

async function getCycle() {
  try {
    const r = await fetch(API, { cache: "no-store" });
    const d = await r.json();
    return {
      isDay: d.isDay,
      expiry: new Date(d.expiry),
      source: "WarframeStat API"
    };
  } catch {
    return localCycle();
  }
}

async function updateUI() {
  const now = new Date();
  timeNowEl.textContent = "Current Time: " + now.toLocaleTimeString("en-US");

  const c = await getCycle();
  const diff = c.expiry - now;

  phaseEl.textContent = "Current Phase: " + (c.isDay ? "Day" : "Night");
  nextChangeEl.textContent =
    `Next Change In: ${Math.floor(diff / 60000)}m ${Math.floor(diff / 1000) % 60}s`;

  sourceEl.textContent = "Source: " + c.source;

  sunLight.intensity = c.isDay ? 1.2 : 0.2;
  earth.material.emissiveIntensity = c.isDay ? 0.2 : 0.9;
}

updateUI();
setInterval(updateUI, 1000);
