import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as animations from './helpers/animations';
import { toggleFullScreen } from './helpers/fullscreen';
import { resizeRendererToDisplaySize } from './helpers/responsiveness';
import './style.css';

const CANVAS_ID = 'scene';

import globeTexture from '/Globe.jpg?url';
import normalTexture from '/normal.jpg?url';

// Scene configuration
const config = {
  sphere: {
    radius: 10,
    widthSegments: 360,
    heightSegments: 180,
    position: new THREE.Vector3(0, -2, 0)
  },
  camera: {
    fov: 50,
    position: new THREE.Vector3(0, 5, 25),
    lookAt: new THREE.Vector3(0, 0, 0),
    unfoldedPosition: new THREE.Vector3(0, 0, 30),
    minDistance: 10,
    maxDistance: 100
  },
  animation: {
    duration: 1.0
  },
  particles: {
    size: 0.1,
    count: 10000,
    speed: 0.05
  }
};

// Global variables
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let sphere: THREE.Mesh;
let camera: THREE.PerspectiveCamera;
let cameraControls: OrbitControls;
let gridHelper: THREE.GridHelper;
let axesHelper: THREE.AxesHelper;
let stats: Stats;
let gui: GUI;
let particles: THREE.Points;
let imagedata: ImageData;

// Application state
const state = {
  animation: {
    enabled: false,
    play: false,
    unfolding: false,
    unfoldStartTime: 0,
    isUnfolded: false
  },
  showGrid: false,
  showAxes: true
};

init();
animate();

function initScene() {
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector(`canvas#${CANVAS_ID}`)!,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function initLights() {
  const ambientLight = new THREE.AmbientLight('white', 0.4);
  const pointLight = new THREE.PointLight('white', 1.2, 400);
  pointLight.position.set(0, 0, 20);
  pointLight.castShadow = true;
  pointLight.shadow.radius = 4;
  
  scene.add(ambientLight);
  scene.add(pointLight);
}

function getImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height);
}

function createSphere() {
  const sphereGeometry = new THREE.SphereGeometry(
    config.sphere.radius,
    config.sphere.widthSegments,
    config.sphere.heightSegments
  );

  const texture = new THREE.TextureLoader().load(globeTexture, (tex) => {
    imagedata = getImageData(tex.image);
    createParticles();
  });
  const normal = new THREE.TextureLoader().load(normalTexture);

  createMorphTarget(sphereGeometry);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    normalMap: normal,
  });

  sphere = new THREE.Mesh(sphereGeometry, material);
  sphere.position.copy(config.sphere.position);
  scene.add(sphere);
}

function createMorphTarget(geometry: THREE.SphereGeometry) {
  const width = 2 * Math.PI * config.sphere.radius;
  const height = Math.PI * config.sphere.radius;
  const planeGeometry = new THREE.PlaneGeometry(
    width, 
    height, 
    config.sphere.widthSegments, 
    config.sphere.heightSegments
  );

  const planePositions = planeGeometry.attributes.position.array as Float32Array;
  const planeUVs = planeGeometry.attributes.uv.array;

  // Create a mapping from UV to plane positions
  for (let i = 0; i < planePositions.length / 3; i++) {
    const u = planeUVs[i * 2];
    const v = planeUVs[i * 2 + 1];
    
    planePositions[i * 3] = (u - 0.5) * width;
    planePositions[i * 3 + 1] = (v - 0.5) * height;
    planePositions[i * 3 + 2] = 0;
  }

  geometry.morphAttributes.position = [];
  geometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(planePositions, 3);
}

function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(config.particles.count * 3);
  const destinations = new Float32Array(config.particles.count * 3);
  const spherePositions = new Float32Array(config.particles.count * 3);
  const speeds = new Float32Array(config.particles.count);
  const colors = new Float32Array(config.particles.count * 3);

  // Create a uniform distribution of points on a sphere
  const radius = config.sphere.radius * 1.01; // Slightly larger than sphere to avoid z-fighting
  let i = 0;
  
  // Use Fibonacci sphere algorithm for uniform distribution
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
  
  for (let j = 0; j < config.particles.count; j++) {
    const y = 1 - (j / (config.particles.count - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y); // radius at y
    
    const theta = phi * j; // Golden angle increment
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    // Sphere positions
    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;
    
    // Store initial sphere positions (same as current positions)
    spherePositions[i * 3] = positions[i * 3];
    spherePositions[i * 3 + 1] = positions[i * 3 + 1];
    spherePositions[i * 3 + 2] = positions[i * 3 + 2];
    
    // Convert spherical coordinates to UV for plane mapping
    const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
    const v = 0.5 - Math.asin(y) / Math.PI;
    
    // Destination positions on plane
    const width = 2 * Math.PI * config.sphere.radius;
    const height = Math.PI * config.sphere.radius;
    destinations[i * 3] = (u - 0.5) * width;
    destinations[i * 3 + 1] = (v - 0.5) * height;
    destinations[i * 3 + 2] = 0;
    
    // Random speed variation
    speeds[i] = config.particles.speed * (0.8 + Math.random() * 0.4);
    
    // Optional: sample color from texture
    if (imagedata) {
      const texX = Math.floor(u * imagedata.width) % imagedata.width;
      const texY = Math.floor((1 - v) * imagedata.height) % imagedata.height;
      const pixelIndex = (texY * imagedata.width + texX) * 4;
      
      colors[i * 3] = imagedata.data[pixelIndex] / 255;
      colors[i * 3 + 1] = imagedata.data[pixelIndex + 1] / 255;
      colors[i * 3 + 2] = imagedata.data[pixelIndex + 2] / 255;
    } else {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }
    
    i++;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('destination', new THREE.BufferAttribute(destinations, 3));
  geometry.setAttribute('spherePosition', new THREE.BufferAttribute(spherePositions, 3));
  geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: config.particles.size,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(geometry, material);
  particles.position.copy(config.sphere.position);
  scene.add(particles);
}

function handleUnfoldAnimation() {
  if (!state.animation.unfolding) return;

  const elapsed = (performance.now() / 1000) - state.animation.unfoldStartTime;
  const progress = Math.min(elapsed / config.animation.duration, 1);
  const easingProgress = progress < 0.5 
    ? 2 * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Ease-in-out

  // Update sphere morph target
  if (sphere.morphTargetInfluences) {
    sphere.morphTargetInfluences[0] = state.animation.isUnfolded 
      ? easingProgress 
      : 1 - easingProgress;
  }

  // Update particle positions
  const positions = particles.geometry.attributes.position.array as Float32Array;
  const destinations = particles.geometry.attributes.destination.array as Float32Array;
  const spherePositions = particles.geometry.attributes.spherePosition.array as Float32Array;

  for (let i = 0; i < positions.length / 3; i++) {
    const spherePos = new THREE.Vector3(
      spherePositions[i * 3],
      spherePositions[i * 3 + 1],
      spherePositions[i * 3 + 2]
    );
    const planePos = new THREE.Vector3(
      destinations[i * 3],
      destinations[i * 3 + 1],
      destinations[i * 3 + 2]
    );

    if (state.animation.isUnfolded) {
      // Unfolding: move from sphere to plane
      positions[i * 3] = spherePos.x + (planePos.x - spherePos.x) * easingProgress;
      positions[i * 3 + 1] = spherePos.y + (planePos.y - spherePos.y) * easingProgress;
      positions[i * 3 + 2] = spherePos.z + (planePos.z - spherePos.z) * easingProgress;
    } else {
      // Folding: move from plane to sphere
      positions[i * 3] = planePos.x + (spherePos.x - planePos.x) * easingProgress;
      positions[i * 3 + 1] = planePos.y + (spherePos.y - planePos.y) * easingProgress;
      positions[i * 3 + 2] = planePos.z + (spherePos.z - planePos.z) * easingProgress;
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;

  // Update camera position
  if (state.animation.isUnfolded) {
    camera.position.lerpVectors(
      config.camera.position,
      config.camera.unfoldedPosition,
      easingProgress
    );
  } else {
    camera.position.lerpVectors(
      config.camera.unfoldedPosition,
      config.camera.position,
      easingProgress
    );
  }
  camera.lookAt(0, 0, 0);

  if (progress >= 1) {
    state.animation.unfolding = false;
    // Ensure final values are exact
    if (sphere.morphTargetInfluences) {
      sphere.morphTargetInfluences[0] = state.animation.isUnfolded ? 1 : 0;
    }
  }
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(
    config.camera.fov,
    renderer.domElement.clientWidth / renderer.domElement.clientHeight,
    0.1,
    1000
  );
  camera.position.copy(config.camera.position);
  camera.lookAt(config.camera.lookAt);
}

function initControls() {
  cameraControls = new OrbitControls(camera, renderer.domElement);
  cameraControls.target.copy(config.camera.lookAt);
  cameraControls.enableDamping = true;
  cameraControls.autoRotate = false;
  cameraControls.minDistance = config.camera.minDistance;
  cameraControls.maxDistance = config.camera.maxDistance;

  window.addEventListener('dblclick', (event) => {
    if (event.target === renderer.domElement) {
      toggleFullScreen(renderer.domElement);
    }
  });
}

function updateControlsForUnfoldedState(isUnfolded: boolean) {
  if (isUnfolded) {
    cameraControls.enableRotate = false;
    cameraControls.enablePan = true;
    cameraControls.enableZoom = true;
    cameraControls.target.set(0, 0, 0);
    camera.up.set(0, 1, 0);
    camera.position.lerp(config.camera.unfoldedPosition, 0.1);
    camera.lookAt(0, 0, 0);
  } else {
    cameraControls.enableRotate = true;
    cameraControls.enablePan = true;
    cameraControls.enableZoom = true;
    camera.position.lerp(config.camera.position, 0.1);
    cameraControls.target.copy(config.camera.lookAt);
  }
}

function initHelpers() {
  axesHelper = new THREE.AxesHelper(15);
  axesHelper.visible = state.showAxes;
  scene.add(axesHelper);

  gridHelper = new THREE.GridHelper(256, 256, 'teal', 'darkgray');
  gridHelper.position.y = -3;
  gridHelper.visible = state.showGrid;
  scene.add(gridHelper);
}

function initGUI() {
  gui = new GUI({ title: '控制面板', width: 300 });

  const sphereFolder = gui.addFolder('球体设置');
  sphereFolder.add(sphere.material, 'wireframe').name('线框模式');
  sphereFolder.add(sphere.material, 'visible').name('显示球体');

  const animFolder = gui.addFolder('动画控制');
  animFolder.add(state.animation, 'enabled').name('启用动画');
  animFolder.add(state.animation, 'play').name('播放/暂停');

  // 光源控制
  const lightFolder = gui.addFolder('光源设置');
  lightFolder.add(scene.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight, 'intensity', 0, 2, 0.1).name('光源强度');
  lightFolder.add(scene.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight, 'distance', 0, 400, 1).name('光源距离');
  lightFolder.add(scene.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight, 'decay', 0, 2, 0.1).name('光源衰减');
  lightFolder.addColor(scene.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight, 'color').name('光源颜色');
  lightFolder.add(scene.children.find(child => child instanceof THREE.AmbientLight) as THREE.AmbientLight, 'intensity', 0, 2, 0.1).name('环境光强度');
  lightFolder.addColor(scene.children.find(child => child instanceof THREE.AmbientLight) as THREE.AmbientLight, 'color').name('环境光颜色');

  gui.add({
  toggleUnfold: () => {
    if (!state.animation.unfolding) {
      state.animation.unfolding = true;
      state.animation.unfoldStartTime = performance.now() / 1000;
      state.animation.isUnfolded = !state.animation.isUnfolded;
      updateControlsForUnfoldedState(state.animation.isUnfolded);
    }
  }
}, 'toggleUnfold').name('展开/收起');

  const helpersFolder = gui.addFolder('辅助工具');
  helpersFolder.add(state, 'showGrid').name('显示网格')
    .onChange((value: boolean) => {
      gridHelper.visible = value;
    });
  helpersFolder.add(state, 'showAxes').name('显示坐标轴')
    .onChange((value: boolean) => {
      axesHelper.visible = value;
    });

  gui.close();
}

function initStats() {
  stats = new Stats();
  document.body.appendChild(stats.dom);
}

function init() {
  initScene();
  initLights();
  createSphere();
  initCamera();
  initControls();
  initHelpers();
  initStats();
  initGUI();
}


function animate() {
  requestAnimationFrame(animate);

  stats.update();

  if (state.animation.enabled && state.animation.play) {
    animations.rotate(sphere, {
      getElapsedTime: () => performance.now() / 1000,
      autoStart: false,
      startTime: 0,
      oldTime: 0,
      elapsedTime: 0,
      running: false,
      start: function (): void {
        throw new Error('Function not implemented.');
      },
      stop: function (): void {
        throw new Error('Function not implemented.');
      },
      getDelta: function (): number {
        throw new Error('Function not implemented.');
      }
    }, Math.PI / 3);
    if (particles) {
      particles.rotation.copy(sphere.rotation);
    }
  }

  handleUnfoldAnimation();

  if (resizeRendererToDisplaySize(renderer)) {
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
  }

  cameraControls.update();
  renderer.render(scene, camera);
}