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
  // slug: '2023_06_29_23_16_47',
  // // slug: '2023_06_30_00_00_48',
  // slug: '2023_06_30_08_15_23',
  // slug: '2023_07_05_13_27_30',
  // slug: '2023_07_05_19_41_05',
  
  slug: '2023_07_05_19_45_20',


  // L2 weights
  // slug: '2023_08_03_09_27_44',
  // slug: '2023_07_11_10_33_35',

  // slug: '2023_08_03_09_26_22',
  // slug: '2023_08_03_09_43_53',
  // slug: '2023_08_03_09_43_13',
  // slug: '2023_08_03_09_42_30', // good L2 d3.selectAll('.annotation-container').remove()
  // slug: '2023_08_03_09_28_08',
  stepIndex: 125,
  stepIndex: 230,
}

// d3.selectAll('.annotation-container').remove()


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
    maxY: 4.5,
    type: 'hidden_w',
    xAxisLabel: 'Digit Index',
  })
  
  window.initEmbedVis({
    sel: paritySel.append('div'),
    state,
    sx: 5,
    sy: 5,
    maxY: 4.5,
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
    stepTarget: 3750,
  })



  var annotations = [
    {
      "parent": ".parity-weights > div > div",
      "minWidth": 850,
      "html": "Only the first three digits provide a generalizing signal",
      "st": {
        "top": 130,
        "left": -150,
        "width": 145
      },
      "path": "M 103,-11 A 36.807 36.807 0 0 0 168,-11",
      "class": "no-shadow"
    },
    {
      "parent": ".parity-weights > div > div",
      "minWidth": 850,
      "html": "The rest are distractions",
      "st": {
        "top": 195,
        "left": 200,
        "width": 200
      },
      "path": "M 15,-11 A 37.585 37.585 0 0 1 -48,-21",
      "class": "no-shadow"
    },
    {
      "parent": ".parity-loss > div",
      "minWidth": 850,
      "html": "Train loss gets a bit worse...",
      "st": {
        "top": 123,
        "left": 100,
        "width": 100,
        "textAlign": "left"
      },
      "path": "M 97,-41 A 23.345 23.345 0 0 0 115.99999237060547,-60"
    },
    {
      "parent": ".parity-weights-trajectory > div",
      "minWidth": 850,
      "html": "...while almost all the weights shrink",
      "st": {
        "top": 23,
        "left": 210,
        "width": 130,
        "text-align": "right"
      },
      "path": "M -105,-48 A 18.289 18.289 0 0 0 -136,-32"
    },
    {
      "parent": ".parity-weights-trajectory > div",
      "minWidth": 850,
      "html": "Distraction digit weights removed",
      "st": {
        "top": 137,
        "left": 264,
        "width": 130
      },
      "path": "M -1,-41 A 28.834 28.834 0 0 1 3,-79"
    }
  ]  
  // window.annotations = annotations
  // annotations.isDraggable = 1

  initSwoopy(annotations)

  util.addAria([
    {selector: '.parity-accuracy', label: `Accuracy over training -- there's grokking on this task`},
    {selector: '.parity-weights', label: `W_input heatmap`},
    {selector: '.parity-loss', label: `Loss over training`},
    {selector: '.parity-weights-trajectory', label: `Each of the W_input weights over training. At first all the weights grow, then most start to shrink to 0 except of couple to the first three digit weights.`},
    {selector: '.sparse-parity-sweep', label: `Grid chart showing how different hyper-parameters can change when and if generalization happens.`},
    {selector: '.sweep-mod', label: `Grid chart showing how different hyper-parameters and architectures can change when and if generalization happens.`},
  ])


}
initSparseParity()