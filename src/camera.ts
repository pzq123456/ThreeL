import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { toggleFullScreen } from './helpers/fullscreen';
import { config } from './config';
import { AppContext } from './types';

export function initCamera(renderer: THREE.WebGLRenderer): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    config.camera.fov,
    renderer.domElement.clientWidth / renderer.domElement.clientHeight,
    0.1,
    1000
  );
  camera.position.copy(config.camera.position);
  camera.lookAt(config.camera.lookAt);
  return camera;
}

export function initControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): OrbitControls {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(config.camera.lookAt);
  controls.enableDamping = true;
  controls.autoRotate = false;
  controls.minDistance = config.camera.minDistance;
  controls.maxDistance = config.camera.maxDistance;

  window.addEventListener('dblclick', (event) => {
    if (event.target === renderer.domElement) {
      toggleFullScreen(renderer.domElement);
    }
  });

  return controls;
}

export function updateControlsForUnfoldedState(controls: OrbitControls, camera: THREE.PerspectiveCamera, isUnfolded: boolean): void {
  if (isUnfolded) {
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    camera.up.set(0, 1, 0);
    camera.position.lerp(config.camera.unfoldedPosition, 0.1);
    camera.lookAt(0, 0, 0);
  } else {
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    camera.position.lerp(config.camera.position, 0.1);
    controls.target.copy(config.camera.lookAt);
  }
}