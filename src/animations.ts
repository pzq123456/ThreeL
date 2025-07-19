import * as THREE from 'three';
import { config } from './config';
import { State, AppContext } from './types';
import { resizeRendererToDisplaySize } from './helpers/responsiveness';

export function handleInitialParticleAnimation(context: AppContext, state: State): void {
  if (!state.animation.initialParticles || 
      !context.particles?.geometry?.attributes || 
      !context.particles.geometry.attributes.position ||
      !context.particles.geometry.attributes.initialPosition ||
      !context.particles.geometry.attributes.spherePosition) {
    console.warn('Particle animation skipped - missing required properties');
    state.animation.initialParticles = false;
    return;
  }

  const elapsed = (performance.now() / 1000) - state.animation.initialStartTime;
  const progress = Math.min(elapsed / config.animation.initialParticleDuration, 1);
  const easingProgress = progress < 0.5 
    ? 2 * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  const positions = context.particles.geometry.attributes.position.array as Float32Array;
  const initialPositions = context.particles.geometry.attributes.initialPosition.array as Float32Array;
  const spherePositions = context.particles.geometry.attributes.spherePosition.array as Float32Array;

  for (let i = 0; i < positions.length / 3; i++) {
    const initialPos = new THREE.Vector3(
      initialPositions[i * 3],
      initialPositions[i * 3 + 1],
      initialPositions[i * 3 + 2]
    );
    const spherePos = new THREE.Vector3(
      spherePositions[i * 3],
      spherePositions[i * 3 + 1],
      spherePositions[i * 3 + 2]
    );

    positions[i * 3] = initialPos.x + (spherePos.x - initialPos.x) * easingProgress;
    positions[i * 3 + 1] = initialPos.y + (spherePos.y - initialPos.y) * easingProgress;
    positions[i * 3 + 2] = initialPos.z + (spherePos.z - initialPos.z) * easingProgress;
  }

  context.particles.geometry.attributes.position.needsUpdate = true;

  if (progress >= 1) {
    state.animation.initialParticles = false;
    if (context.sphere && !state.animation.unfolding) {
      context.sphere.visible = true;
    }
  }
}

export function handleUnfoldAnimation(context: AppContext, state: State): void {
  if (!state.animation.unfolding || 
      !context.sphere || 
      !context.particles?.geometry?.attributes || 
      !context.particles.geometry.attributes.position ||
      !context.particles.geometry.attributes.destination ||
      !context.particles.geometry.attributes.spherePosition) {
    console.warn('Unfold animation skipped - missing required properties');
    state.animation.unfolding = false;
    return;
  }

  // Hide sphere during animation
  context.sphere.visible = false;

  const elapsed = (performance.now() / 1000) - state.animation.unfoldStartTime;
  const progress = Math.min(elapsed / config.animation.duration, 1);
  const easingProgress = progress < 0.5 
    ? 2 * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  if (context.sphere.morphTargetInfluences) {
    context.sphere.morphTargetInfluences[0] = state.animation.isUnfolded 
      ? easingProgress 
      : 1 - easingProgress;
  }

  const positions = context.particles.geometry.attributes.position.array as Float32Array;
  const destinations = context.particles.geometry.attributes.destination.array as Float32Array;
  const spherePositions = context.particles.geometry.attributes.spherePosition.array as Float32Array;

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
      positions[i * 3] = spherePos.x + (planePos.x - spherePos.x) * easingProgress;
      positions[i * 3 + 1] = spherePos.y + (planePos.y - spherePos.y) * easingProgress;
      positions[i * 3 + 2] = spherePos.z + (planePos.z - spherePos.z) * easingProgress;
    } else {
      positions[i * 3] = planePos.x + (spherePos.x - planePos.x) * easingProgress;
      positions[i * 3 + 1] = planePos.y + (spherePos.y - planePos.y) * easingProgress;
      positions[i * 3 + 2] = planePos.z + (spherePos.z - planePos.z) * easingProgress;
    }
  }

  context.particles.geometry.attributes.position.needsUpdate = true;

  if (context.camera) {
    if (state.animation.isUnfolded) {
      context.camera.position.lerpVectors(
        config.camera.position,
        config.camera.unfoldedPosition,
        easingProgress
      );
    } else {
      context.camera.position.lerpVectors(
        config.camera.unfoldedPosition,
        config.camera.position,
        easingProgress
      );
    }
    context.camera.lookAt(0, 0, 0);
  }

  if (progress >= 1) {
    state.animation.unfolding = false;
    if (context.sphere.morphTargetInfluences) {
      context.sphere.morphTargetInfluences[0] = state.animation.isUnfolded ? 1 : 0;
    }
    // Show sphere (plane or sphere geometry) after animation completes
    if (context.sphere) {
      context.sphere.visible = true;
    }
  }
}

export function animate(context: AppContext, state: State): void {
  requestAnimationFrame(() => animate(context, state));

  if (context.stats) {
    context.stats.update();
  }

  if (state.animation.initialParticles && context.particles) {
    handleInitialParticleAnimation(context, state);
  }

  if (state.animation.enabled && state.animation.play && context.sphere) {
    context.sphere.rotation.y += 0.005;
    
    if (context.particles) {
      context.particles.rotation.copy(context.sphere.rotation);
    }
  }

  if (state.animation.unfolding) {
    handleUnfoldAnimation(context, state);
  }

  if (context.renderer && context.camera) {
    if (resizeRendererToDisplaySize(context.renderer)) {
      context.camera.aspect = context.renderer.domElement.clientWidth / context.renderer.domElement.clientHeight;
      context.camera.updateProjectionMatrix();
    }

    if (context.cameraControls) {
      context.cameraControls.update();
    }
    
    context.renderer.render(context.scene, context.camera);
  }
}