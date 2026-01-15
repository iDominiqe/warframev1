/* =================================================
   IMPORTS (CDN ONLY — NO "three")
================================================= */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js";

/* =================================================
   BASIC THREE.JS SETUP
================================================= */

const canvas = document.getElementById("bg");
const statusEl = document.getElementById("status");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

/* Controls (mouse rotation like Google Maps) */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 8;

/* =================================================
   LIGHTS
================================================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(5, 3, 5);
scene.add(light);

/* =================================================
   LOAD GLB MODEL
================================================= */

const loader = new GLTFLoader();

loader.load(
  "./earth_breathing.glb",
  (gltf) => {
    const model = gltf.scene;

    model.scale.set(1.5, 1.5, 1.5);
    scene.add(model);

    statusEl.textContent = "Model loaded successfully";

    // simple slow rotation
    model.userData.rotate = true;
  },
  (progress) => {
    const percent = (progress.loaded / progress.total) * 100;
    statusEl.textContent = `Loading: ${percent.toFixed(0)}%`;
  },
  (error) => {
    console.error("GLB load error:", error);
    statusEl.textContent = "Failed to load model";
  }
);

/* =================================================
   ANIMATION LOOP
================================================= */

function animate() {
  requestAnimationFrame(animate);

  scene.traverse((obj) => {
    if (obj.userData.rotate) {
      obj.rotation.y += 0.0006;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

/* =================================================
   RESIZE HANDLER
================================================= */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
