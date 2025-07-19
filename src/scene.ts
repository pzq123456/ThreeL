import * as THREE from 'three';
import { AppContext } from './types';

const CANVAS_ID = 'scene';

export function initScene(): Pick<AppContext, 'scene' | 'renderer'> {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector(`canvas#${CANVAS_ID}`)!,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return { scene, renderer };
}

export function initLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight('white', 0.4);
  const pointLight = new THREE.PointLight('white', 1.2, 400);
  pointLight.position.set(0, 0, 20);
  pointLight.castShadow = true;
  pointLight.shadow.radius = 4;
  
  scene.add(ambientLight);
  scene.add(pointLight);
}