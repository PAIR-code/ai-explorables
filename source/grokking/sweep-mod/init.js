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

window.modSweepState = window.modSweepStatex || {
  maxRatio: 50000,
  minEvalLoss: .00001,

  sweepSlug: 'xm_gpu_sparse_parity_v2',
  sweepSlug: 'sparse_parity_v3',
  sweepSlug: 'sparse_parity_v4',
  key_row: '',
  key_col: 'embed_size',
  key_x: 'weight_decay',
  key_y: 'learning_rate',
  is_symmetric_input: true,
  hyper_sweep: {
    "seed": d3.range(9),
    "weight_decay": [1e-2, 3e-2, 1e-1, 3e-1, 1e-0],
    "hidden_size": [16, 32, 64, 128, 258].reverse(),
    "train_size": [750, 1000, 1250, 1500, 1750],
  }
}
window.state = window.modSweepState

window.initModSweep = async function(){
  console.clear()

  var state = window.modSweepState

  state.fmt = function(str){
    return str.replace('input_tied', 'untied')
  }

  state.renderAll = util.initRenderAll(['color', 'hover', 'type'])
  state.isHoveredFn = d => {
    var h = state.hovered 
    return d[state.key_row] == h[state.key_row] && 
      d[state.key_col] == h[state.key_col] && 
      d[state.key_x] == h[state.key_x] && 
      d[state.key_y] == h[state.key_y]
  }

  state.circleFillFn = d => {
    if (d.minTrainLoss > state.minEvalLoss) return util.colors.sweepNoLearn
    if (d.minEvalLoss > state.minEvalLoss) return util.colors.sweepNoGen

    if (d.maxRatio < state.maxRatio) return util.colors.sweepGen
    return util.colors.sweepGrok
  }

  state.modelsL1 = await util.getFile('/mlp_modular/02-sweep-architecture/data__hypers_xm_gpu_full_l1_architecture.csv')
  state.modelsL2 = await util.getFile('/mlp_modular/02-sweep-architecture/data__hypers_xm_gpu_full_l2_architecture_v2.csv')
  state.sharedHyper = await util.getFile('/mlp_modular/02-sweep-architecture/hyper_shared.json')
  state.modelsL1.isL1 = true
  
  var sel = d3.select('.sweep-mod').html(`
    <div class='left-col'>
      <div class='legend'></div>
      <div class='wd-type-container'></div>
      <div class='sliders-container'></div>
    </div>

    <div class='right-col'>
      <div class='formula'></div>
      <div class='model-grid'></div>
      <div class='line-chart-hyper'></div>
      <div class='line-charts'></div>
      <div class='line-legend'></div>
    </div>
  `)

  var chartFn = window.sweepModCharts
  chartFn.drawWdType({state, sel, key: 'modelsL2'})
  chartFn.drawWdType({state, sel, key: 'modelsL1'})
  state.allModels = state.modelsL1.concat(state.modelsL2)
  
  chartFn.drawLegend({state, sel})
  chartFn.drawLineLegend({sel: sel.select('.line-legend')})
  chartFn.drawSliders({state, sel})

  state.hovered = state.modelsL2[100]
  state.hoveredType = state.modelsL2[100].type

  state.renderAll.type.fns.push(() => {
    // update state with data for rendering rh side
    state.models = state.allModels.filter(d => d.type == state.hoveredType)
    
    var isL1 = state.hovered.regularization == 'l1'
    state.hyper_sweep = (isL1 ? state.modelsL1 : state.modelsL2).hyper_sweep
    state.sweepSlug = isL1 ? 'xm_gpu_full_l1_architecture' : 'xm_gpu_full_l2_architecture_v2'

    // remove previous listeners    
    state.renderAll.hover.fns = state.renderAll.hover.fns.filter(d => !d.isRight)
    state.renderAll.color.fns = state.renderAll.color.fns.filter(d => !d.isRight)

    chartFn.drawFormula({state, sel})
    chartFn.drawGrid({state, sel})
    chartFn.drawLineCharts({state, sel})

    state.renderAll.color()
    state.renderAll.hover()
  })
  state.renderAll.type()
}

window.initModSweep()
