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


window.initLineErrorVis = async function({type, state, sel, title, caption}){
  
  sel = sel.append('div')
  drawTop()
  drawBot()

  function drawBot(){
    var c = d3.conventions({
      sel: sel.append('div'),
      width:  300,
      height: 100,
      layers: 's',
      margin: {top: 20, bottom: 30, left: 30},
    })

    var max = state.n_tokens/2
    c.x.domain([-max, max])
    
    var max = d3.max(state.allOutSumPos, d => Math.abs(d.numDiff))
    c.y.domain([-max, max])


    c.xAxis.ticks(5)
    c.yAxis.ticks(5)
    d3.drawAxis(c)
    util.ggPlot(c)

    util.addAxisLabel(c, 'Target', 'Output - Target', 30, -25)

    var maxError = (state.allOutSumPos[0].numOutput - state.allOutSumPos[0].numCorrect) % state.n_tokens
    c.svg.appendMany('circle', state.allOutSumPos)
      .at({r: 1.5, fill: '#ccc'})
      // .translate(d => [c.x(d.numCorrect), c.y(Math.cos(d.numCorrect*Math.PI)/7)])

    var circleSel = c.svg.appendMany('circle', state.allOutSumPos)
      .at({r: 1.5, stroke: '#f0f'})
      .translate(d => [c.x(d.numCorrect), c.y(d.numOutput - d.numCorrect)])

    state.renderAll.input.fns.push(() => {
      circleSel.st({strokeWidth: d => d.correct == state.correct ? 4 : 0})
    })
  }

  function drawTop(){
   var c = d3.conventions({
     sel: sel.append('div'),
     width:  300,
     height: 300,
     layers: 's',
     margin: {top: 30, bottom: 30, left: 30},
   })
   c.svg.append('text').text(title)
     .at({y: -5, fontSize: 14, fontWeight: 600})


   var max = Math.PI
   var max = state.n_tokens/2
   c.x.domain([-max, max])
   c.y.domain([-max, max])


   c.xAxis.ticks(5)
   c.yAxis.ticks(5)
   d3.drawAxis(c)
   util.ggPlot(c)

   util.addAxisLabel(c, 'Target', 'Output', 30, -25)

   c.svg.appendMany('circle', state.allOutSumPos)
     .at({r: 1.5, fill: '#ccc'})
     .translate(d => [c.x(d.numCorrect), c.y(d.numCorrect)])

   var circleSel = c.svg.appendMany('circle', state.allOutSumPos)
     .at({r: 1.5, stroke: '#f0f'})
     .translate(d => [c.x(d.numCorrect), c.y(d.numOutput)])

   state.renderAll.input.fns.push(() => {
     circleSel.st({strokeWidth: d => d.correct == state.correct ? 4 : 0})
   })
  }


}
window.initAppendix?.()
