import GUI from 'lil-gui';
import { config } from './config';
import { State, AppContext } from './types';
import { updateControlsForUnfoldedState } from './camera';

export function initGUI(context: AppContext, state: State): GUI {
  const gui = new GUI({ title: '控制面板', width: 300 });

  gui.add({
    toggleUnfold: () => {
      if (!state.animation.unfolding) {
        state.animation.unfolding = true;
        state.animation.unfoldStartTime = performance.now() / 1000;
        state.animation.isUnfolded = !state.animation.isUnfolded;
        updateControlsForUnfoldedState(context.cameraControls, context.camera, state.animation.isUnfolded);
      }
    }
  }, 'toggleUnfold').name('展开/收起');

  gui.add(config.animation, 'duration', 1.0, 10.0).name('动画持续时间').onChange((value: number) => {
    config.animation.duration = value;
  });

  gui.add(state.animation, 'initialParticles').name('初始粒子动画')
    .onChange((value: boolean) => {
      if (value) {
        state.animation.initialStartTime = performance.now() / 1000;
        state.animation.initialParticles = true;
        context.sphere.visible = false;
      } else {
        state.animation.initialParticles = false;
        context.sphere.visible = true;
      }
    });

  gui.add(config.animation, 'initialParticleDuration', 1.0, 5.0).name('初始粒子动画持续时间').onChange((value: number) => {
    config.animation.initialParticleDuration = value;
  });

  const helpersFolder = gui.addFolder('辅助工具');
  helpersFolder.add(state, 'showGrid').name('显示网格')
    .onChange((value: boolean) => {
      context.gridHelper.visible = value;
    });
  helpersFolder.add(state, 'showAxes').name('显示坐标轴')
    .onChange((value: boolean) => {
      context.axesHelper.visible = value;
    });

  gui.close();
  return gui;
}