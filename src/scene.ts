import GUI from 'lil-gui'
import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  Clock,
  GridHelper,
  Group,
  LineBasicMaterial,
  LoadingManager,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  Scene,
  WebGLRenderer,
} from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import * as animations from './helpers/animations'
import { toggleFullScreen } from './helpers/fullscreen'
import { resizeRendererToDisplaySize } from './helpers/responsiveness'
import './style.css'

import * as THREE from 'three';
// import axios from 'axios';



const CANVAS_ID = 'scene'

let canvas: HTMLElement
let renderer: WebGLRenderer
let scene: Scene
let loadingManager: LoadingManager
let ambientLight: AmbientLight
let pointLight: PointLight
let sphere: Mesh
let camera: PerspectiveCamera
let cameraControls: OrbitControls
let dragControls: DragControls
let axesHelper: AxesHelper
let pointLightHelper: PointLightHelper
let clock: Clock
let stats: Stats
let gui: GUI

const animation = { enabled: false, play: true }

init()
animate()

function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector(`canvas#${CANVAS_ID}`)!
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap
    scene = new Scene()
  }

  // ===== 👨🏻‍💼 LOADING MANAGER =====
  {
    loadingManager = new LoadingManager()

    loadingManager.onStart = () => {
      console.log('loading started')
    }
    loadingManager.onProgress = (url, loaded, total) => {
      console.log('loading in progress:')
      console.log(`${url} -> ${loaded} / ${total}`)
    }
    loadingManager.onLoad = () => {
      console.log('loaded!')
    }
    loadingManager.onError = () => {
      console.log('❌ error while loading')
    }
  }

  // ===== 💡 LIGHTS =====
  {
    ambientLight = new AmbientLight('white', 0.4)
    pointLight = new PointLight('white', 1.2, 400)
    pointLight.position.set(0, 0, 20)
    pointLight.castShadow = true
    pointLight.shadow.radius = 4
    pointLight.shadow.camera.near = 0.5
    pointLight.shadow.camera.far = 4000
    pointLight.shadow.mapSize.width = 2048
    pointLight.shadow.mapSize.height = 2048
    scene.add(ambientLight)
    scene.add(pointLight)
  }

  // ===== 📦 OBJECTS =====
  {
      
    const sphereMesh = new THREE.SphereGeometry (10, 360, 180);
    const texture = new THREE.TextureLoader().load('./Globe.jpg');
    const normal = new THREE.TextureLoader().load('./normal.jpg');
    const material = new MeshStandardMaterial({
      map: texture,
      normalMap: normal,
    })
    sphere = new THREE.Mesh(
      sphereMesh,
      material
  )
  scene.add(sphere);
}

  // ===== 🎥 CAMERA =====
  {
    camera = new PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1)
    camera.position.set(0, 0, 20)
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls = new OrbitControls(camera, canvas)
    cameraControls.target = sphere.position.clone()
    cameraControls.enableDamping = true
    cameraControls.autoRotate = false
    cameraControls.update()
    // Full screen
    window.addEventListener('dblclick', (event) => {
      if (event.target === canvas) {
        toggleFullScreen(canvas)
      }
    })
  }

  // ===== 🪄 HELPERS =====
  {
    axesHelper = new AxesHelper(15)
    axesHelper.visible = true
    scene.add(axesHelper)

    pointLightHelper = new PointLightHelper(pointLight, undefined, 'orange')
    pointLightHelper.visible = false
    scene.add(pointLightHelper)

    const gridHelper = new GridHelper(256, 256, 'teal', 'darkgray')
    gridHelper.position.y = -3
  }

  // ===== 📈 STATS & CLOCK =====
  {
    clock = new Clock()
    stats = new Stats()
    document.body.appendChild(stats.dom)
  }

  // ==== 🐞 DEBUG GUI ====
  {
    gui = new GUI({ title: '🐞 Debug GUI', width: 300 })
    const sphereFolder = gui.addFolder('Sphere')
    sphereFolder.add(sphere.position, 'x', -10, 10, 0.01).name('x')
    sphereFolder.add(sphere.position, 'y', -10, 10, 0.01).name('y')
    sphereFolder.add(sphere.position, 'z', -10, 10, 0.01).name('z')
    sphereFolder.add(sphere.rotation, 'x', -Math.PI, Math.PI, 0.01).name('rotation x')
    sphereFolder.add(sphere.rotation, 'y', -Math.PI, Math.PI, 0.01).name('rotation y')
    sphereFolder.add(sphere.rotation, 'z', -Math.PI, Math.PI, 0.01).name('rotation z')
    sphereFolder.add(sphere.scale, 'x', 0, 10, 0.01).name('scale x')
    sphereFolder.add(sphere.scale, 'y', 0, 10, 0.01).name('scale y')
    sphereFolder.add(sphere.scale, 'z', 0, 10, 0.01).name('scale z')
    sphereFolder.add(sphere.material, 'wireframe').name('wireframe')
    sphereFolder.add(sphere.material, 'visible').name('visible')

    // animations
    const animationsFolder = gui.addFolder('Animations')
    animationsFolder.add(animation, 'enabled').name('enabled')
    animationsFolder.add(animation, 'play').name('play')


    const lightsFolder = gui.addFolder('Lights')
    lightsFolder.add(pointLight, 'visible').name('point light')
    lightsFolder.add(ambientLight, 'visible').name('ambient light')

    const helpersFolder = gui.addFolder('Helpers')
    helpersFolder.add(axesHelper, 'visible').name('axes')
    helpersFolder.add(pointLightHelper, 'visible').name('pointLight')

    const cameraFolder = gui.addFolder('Camera')
    cameraFolder.add(cameraControls, 'autoRotate')

    // persist GUI state in local storage on changes
    gui.onFinishChange(() => {
      const guiState = gui.save()
      localStorage.setItem('guiState', JSON.stringify(guiState))
    })

    // load GUI state if available in local storage
    const guiState = localStorage.getItem('guiState')
    if (guiState) gui.load(JSON.parse(guiState))

    // reset GUI state button
    const resetGui = () => {
      localStorage.removeItem('guiState')
      gui.reset()
    }
    gui.add({ resetGui }, 'resetGui').name('RESET')

    gui.close()
  }
}

function animate() {
  requestAnimationFrame(animate)

  stats.update()

  if (animation.enabled && animation.play) {
    animations.rotate(sphere, clock, Math.PI / 3)
    animations.bounce(sphere, clock, 1, 0.5, 0.5)
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement
    camera.aspect = canvas.clientWidth / canvas.clientHeight
    camera.updateProjectionMatrix()
  }

  cameraControls.update()

  renderer.render(scene, camera)
}


