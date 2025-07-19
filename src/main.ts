import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import './style.css';
import { initScene, initLights } from './scene';
import { createSphere } from './sphere';
import { createParticles } from './particles';
import { initCamera, initControls } from './camera';
import { initGUI } from './gui';
import { animate } from './animations';
import { State, AppContext } from './types';

const state: State = {
  animation: {
    enabled: false,
    play: false,
    unfolding: false,
    unfoldStartTime: 0,
    isUnfolded: false,
    initialParticles: true,
    initialStartTime: 0
  },
  showGrid: false,
  showAxes: true
};

function initHelpers(scene: THREE.Scene, state: State): Pick<AppContext, 'gridHelper' | 'axesHelper'> {
  const axesHelper = new THREE.AxesHelper(15);
  axesHelper.visible = state.showAxes;
  scene.add(axesHelper);

  const gridHelper = new THREE.GridHelper(256, 256, 'teal', 'darkgray');
  gridHelper.position.y = -3;
  gridHelper.visible = state.showGrid;
  scene.add(gridHelper);

  return { gridHelper, axesHelper };
}

function initStats(): Stats {
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  return stats;
}

function init() {
  const { scene, renderer } = initScene();
  initLights(scene);
  const camera = initCamera(renderer);
  const cameraControls = initControls(camera, renderer);
  const { gridHelper, axesHelper } = initHelpers(scene, state);
  const stats = initStats();

  let context: AppContext = {
    renderer,
    scene,
    sphere: null as any,
    camera,
    cameraControls,
    gridHelper,
    axesHelper,
    stats,
    gui: null as any,
    particles: null as any
  };

  context.sphere = createSphere(scene, (imagedata) => {
    context.imagedata = imagedata;
    context.particles = createParticles(scene, imagedata);
    state.animation.initialStartTime = performance.now() / 1000;
    context.sphere.visible = false;
  });

  context.gui = initGUI(context, state);

  animate(context, state);
}

init();