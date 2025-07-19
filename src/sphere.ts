import * as THREE from 'three';
import { config } from './config';
import globeTexture from '/Neight.png?url';
import normalTexture from '/normal.jpg?url';

export function getImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height);
}

export function createSphere(scene: THREE.Scene, onTextureLoaded: (imagedata: ImageData) => void): THREE.Mesh {
  const sphereGeometry = new THREE.SphereGeometry(
    config.sphere.radius,
    config.sphere.widthSegments,
    config.sphere.heightSegments
  );

  const texture = new THREE.TextureLoader().load(globeTexture, (tex) => {
    const imagedata = getImageData(tex.image);
    onTextureLoaded(imagedata);
  });
  const normal = new THREE.TextureLoader().load(normalTexture);

  createMorphTarget(sphereGeometry);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    normalMap: normal,
    side: THREE.DoubleSide, // Ensure material is visible from both sides in unfolded state
  });

  const sphere = new THREE.Mesh(sphereGeometry, material);
  sphere.position.copy(config.sphere.position);
  sphere.visible = false; // Initially hidden for particle animation
  scene.add(sphere);
  
  return sphere;
}

export function createMorphTarget(geometry: THREE.SphereGeometry): void {
  const width = 2 * Math.PI * config.sphere.radius;
  const height = Math.PI * config.sphere.radius;
  const planeGeometry = new THREE.PlaneGeometry(
    width, 
    height, 
    config.sphere.widthSegments, 
    config.sphere.heightSegments
  );

  const planePositions = planeGeometry.attributes.position.array as Float32Array;
  const planeUVs = planeGeometry.attributes.uv.array as Float32Array;
  const sphereUVs = geometry.attributes.uv.array; // Get sphere's UVs to match

  // Match plane UVs to sphere UVs to ensure correct texture mapping
  for (let i = 0; i < planeUVs.length; i++) {
    (planeUVs as Float32Array)[i] = sphereUVs[i]; // Copy sphere UVs to plane
  }
  planeGeometry.attributes.uv.needsUpdate = true;

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