import * as THREE from 'three';

export const config = {
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
    duration: 3.0,
    initialParticleDuration: 2.0
  },
  particles: {
    size: 0.5,
    count: 1000,
    speed: 0.5
  }
};