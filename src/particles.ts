import * as THREE from 'three';
import { config } from './config';
import { AppContext } from './types';

export function createParticles(scene: THREE.Scene, imagedata: ImageData): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(config.particles.count * 3);
  const destinations = new Float32Array(config.particles.count * 3);
  const spherePositions = new Float32Array(config.particles.count * 3);
  const initialPositions = new Float32Array(config.particles.count * 3);
  const speeds = new Float32Array(config.particles.count);
  const colors = new Float32Array(config.particles.count * 3);

  const radius = config.sphere.radius * 1.01;
  const phi = Math.PI * (3 - Math.sqrt(5));
  
  for (let j = 0, i = 0; j < config.particles.count; j++, i++) {
    const y = 1 - (j / (config.particles.count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * j;
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    spherePositions[i * 3] = x * radius;
    spherePositions[i * 3 + 1] = y * radius;
    spherePositions[i * 3 + 2] = z * radius;
    
    const behindDistance = 30 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    const spread = 0.2 + Math.random() * 0.3;
    initialPositions[i * 3] = Math.cos(angle) * spread * behindDistance;
    initialPositions[i * 3 + 1] = Math.sin(angle) * spread * behindDistance;
    initialPositions[i * 3 + 2] = -behindDistance;
    
    positions[i * 3] = initialPositions[i * 3];
    positions[i * 3 + 1] = initialPositions[i * 3 + 1];
    positions[i * 3 + 2] = initialPositions[i * 3 + 2];
    
    const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
    const v = 0.5 - Math.asin(y) / Math.PI;
    
    const width = 2 * Math.PI * config.sphere.radius;
    const height = Math.PI * config.sphere.radius;
    const lat = Math.asin(y);
    const lon = Math.atan2(z, x);
    destinations[i * 3] = (lon / Math.PI) * (width / 2);
    destinations[i * 3 + 1] = (lat / (Math.PI / 2)) * (height / 2);
    destinations[i * 3 + 2] = 0;
    
    speeds[i] = config.particles.speed * (0.8 + Math.random() * 0.4);
    
    const texX = Math.floor(u * imagedata.width) % imagedata.width;
    const texY = Math.floor((1 - v) * imagedata.height) % imagedata.height;
    const pixelIndex = (texY * imagedata.width + texX) * 4;
    
    colors[i * 3] = imagedata.data[pixelIndex] / 255;
    colors[i * 3 + 1] = imagedata.data[pixelIndex + 1] / 255;
    colors[i * 3 + 2] = imagedata.data[pixelIndex + 2] / 255;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('destination', new THREE.BufferAttribute(destinations, 3));
  geometry.setAttribute('spherePosition', new THREE.BufferAttribute(spherePositions, 3));
  geometry.setAttribute('initialPosition', new THREE.BufferAttribute(initialPositions, 3));
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

  const particles = new THREE.Points(geometry, material);
  particles.position.copy(config.sphere.position);
  scene.add(particles);
  return particles;
}