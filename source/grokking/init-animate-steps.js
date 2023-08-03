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


window.initAnimateSteps = async function({state, sel, stepTarget, duration=3000, minStep=Infinity, isBlink}){

  var timer = {}
  var nextStep = -1

  sel.classed('blink', isBlink)
    .selectAppend('span').text(' ⏵')

  sel.on('click', function(){
    sel.classed('blink', 0)
    timer.stop?.()

    var s0 = Math.min(state.stepIndex, stepToStepIndex(minStep))
    var s1 = stepToStepIndex(stepTarget)
    timer = d3.timer(s => {
      var t = d3.clamp(0, s/duration, 1)

      state.stepIndex = nextStep = Math.round(s0 + t*(s1 - s0))
      state.renderAll.step()

      if (t == 1){
        timer.stop()
      }
    })
  })

  state.renderAll.step.fns.push(() => {
    if (state.stepIndex != nextStep) timer.stop?.()
  })

  function stepToStepIndex(step){
    return Math.floor(step/state.hyper.save_every)
  }
}


window.initModTop?.()
// window.initSparseParity?.()
// window.initModBot?.()
