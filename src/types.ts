import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';

export interface State {
  animation: {
    enabled: boolean;
    play: boolean;
    unfolding: boolean;
    unfoldStartTime: number;
    isUnfolded: boolean;
    initialParticles: boolean;
    initialStartTime: number;
  };
  showGrid: boolean;
  showAxes: boolean;
}

export interface AppContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  sphere: THREE.Mesh;
  camera: THREE.PerspectiveCamera;
  cameraControls: OrbitControls;
  gridHelper: THREE.GridHelper;
  axesHelper: THREE.AxesHelper;
  stats: Stats;
  gui: GUI;
  particles: THREE.Points;
  imagedata?: ImageData;
}