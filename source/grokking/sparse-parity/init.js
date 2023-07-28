/* Copyright 2023 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/


window.sparseState = window.sparseStateX || {
  isLocked: false,
  slug: '2023_06_28_22_46_45',
  slug: '2023_06_29_23_09_07',
  slug: '2023_06_29_23_11_10',
  slug: '2023_06_29_23_16_47',
  // slug: '2023_06_30_00_00_48',
  slug: '2023_06_30_08_15_23',
  slug: '2023_07_05_13_27_30',
  slug: '2023_07_05_19_41_05',
  slug: '2023_07_05_19_45_20',
  stepIndex: 125,
}

window.initSparseParity = async function(){
  // console.clear()

  var state = sparseState
  state.modelPath = `/mlp_modular/sparse_parity/${state.slug}`
  state.renderAll = util.initRenderAll(['step'])
  

  state.hyper = await util.getFile(state.modelPath + '/hyper.json')
  if (state.slug == '2023_06_29_23_16_47') state.hyper.max_steps = 20000

  window.initAccuracyChart({
    sel: d3.select('.parity-accuracy'),
    state,
    isLoss: 0,
  })

  window.initAccuracyChart({
    sel: d3.select('.parity-loss'),
    state,
    isLoss: 1,
  })


  state.hidden_w = await util.getFile(state.modelPath + '/hidden_w.npy')
  // state.out_w = await util.getFile(state.modelPath + '/out_w.npy')
  state.out_w = await util.getFile(state.modelPath + '/out_t_w.npy')
  
  var paritySel = d3.select('.parity-weights').html('')

  window.initEmbedVis({
    sel: paritySel.append('div'),
    state,
    sx: 5,
    sy: 5,
    maxY: 4,
    type: 'hidden_w',
    xAxisLabel: 'Input Index',
  })
  
  window.initEmbedVis({
    sel: paritySel.append('div'),
    state,
    sx: 5,
    sy: 5,
    maxY: 4,
    type: 'out_w',
    xAxisLabel: '',
    yAxisLabel: '',
    isTiny: true
  })

  window.initParityWeightsTrajectory({
    sel: d3.select('.parity-weights-trajectory'),
    state,
    type: 'hidden_w',
  })

  state.renderAll.step()


  initAnimateSteps({
    sel: d3.select(`animate[data-animate='sp-mem']`),
    state,
    minStep: 200,
    stepTarget: 1200,
  })

  initAnimateSteps({
    sel: d3.select(`animate[data-animate='sp-gen']`),
    state,
    minStep: 1200,
    stepTarget: 3008,
  })

}
initSparseParity()