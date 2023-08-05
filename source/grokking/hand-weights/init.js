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



window.handWeightsState = window.xhandWeightsState || {
  embed_size: 2,
  hidden_size: 5,
  n_tokens: 67,
  hidden_r: 1,
  out_r: 1,
  rotation: Math.PI/5*2,
  rotation: 0,
  a: 2,
  b: 9,
  isLocked: false,
}
handWeightsState.temp_out_w = d3.range(handWeightsState.hidden_size).map(() => [0, 0])

window.initHandWeights = function(){
  // console.clear()

  var state = handWeightsState
  state.renderAll = util.initRenderAll(['model', 'input', 'dim'])

  function updateModel(){
    var {n_tokens, hidden_r, out_r, hidden_size, rotation} = state

    var model = state.model = {
      embed: d3.range(n_tokens).map(i => [
        Math.cos(2*Math.PI*i/n_tokens),
        Math.sin(2*Math.PI*i/n_tokens),
      ]),
      hiddenWT: d3.range(hidden_size).map(i => [
        Math.cos(i*Math.PI*2/hidden_size + rotation)*hidden_r,
        Math.sin(i*Math.PI*2/hidden_size + rotation)*hidden_r,
      ]),
    } 

    model.hiddenW = util.transpose(model.hiddenWT)

    var radiusRatio = out_r/hidden_r
    model.outW = d3.range(hidden_size).map(i => {
      i = i*2 % hidden_size
      return [model.hiddenW[0][i]*radiusRatio, model.hiddenW[1][i]*radiusRatio]  
    })

    model.outWT = util.transpose(model.outW)
    model.embedT = util.transpose(model.embed)
  }
  updateModel()



  updateModel()

  initEmbedCircleVis({type: 'embed', state, sx: 5, sy: 20})

  return state.renderAll.model()

  initEmbedCircleVis({type: 'hiddenW', state})
  initEmbedCircleVis({type: 'outWT', state})
  // initCircleWeightsVis({type: 'embed', state})
  // initCircleWeightsVis({type: 'hiddenWT', state})
  // initCircleWeightsVis({type: 'outW', state})

  initCircleWeightsFreqs({type: 'hiddenWT', state})
  initCircleWeightsFreqs({type: 'outW', state})

  // initInputSliders({
  //   sel: d3.select('.circle-input-sliders').html(''),
  //   state,
  // })  
  initCircleInputVis({type: 'hiddenWT', state})
  initCircleInputVis({type: 'outW', state})
  initCircleInputVis({type: 'outW-embed', state})

  // initActivationVis(state)


  state.renderAll.model()


  state.renderAll.input.fns.push(() => {
    var hidden_size = 5
    var P = d3.range(hidden_size).map(i => i*Math.PI*2/hidden_size)
    var A = state.temp_out_w.map(d => d.hiddenVal)

    var neurons = d3.zip(A, P)

    var top = d3.sum(neurons, ([a, p]) => a*Math.sin(p))
    var bot = d3.sum(neurons, ([a, p]) => a*Math.cos(p))
    var phase = Math.atan2(top, bot)
    // console.log(phase*state.n_tokens/Math.PI) // not sure why this isn't exactly right?
  })

  state.renderAll.input()

}
window.initHandWeights?.()
