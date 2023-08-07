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


window.appendixState = window.appendixStatez || {
  n_tokens: 67,
  a: 5,
  b: 20,
  n_neurons: 5,
  rotation: .15,
  // rotation: 0,
  freq: 1,
}

window.initAppendix = function(){
  // console.clear()
  
  var state = window.appendixState
  var {n_tokens, n_neurons, rotation, freq} = state
  
  state.renderAll = util.initRenderAll(['model', 'input', 'dim'])

  function initModel(){
    
    state.embed = d3.range(n_tokens).map(i => [
      Math.cos(2*Math.PI*freq*i/n_tokens),
      Math.sin(2*Math.PI*freq*i/n_tokens),
    ])

    state.unembed = d3.range(n_tokens*2).map(i => [
      Math.cos(2*Math.PI*freq*i/n_tokens/2),
      Math.sin(2*Math.PI*freq*i/n_tokens/2),
    ])

    state.neurons = d3.range(n_neurons).map(i => {
      // var rotation = Math.random()
      var θ = i*Math.PI*freq*2/n_neurons + rotation
      var inProj = [Math.cos(θ), Math.sin(θ)]
      // console.log(θ, inProj)

      return {i, inProj, color: d3.schemeCategory10[i], inθ: θ}
    })

    // force mirroring with an even number of N
    state.neurons.forEach((d, i) => {
      var m = state.neurons[i + state.n_neurons/2]
      if (!m) return
      var [x, y] = m.inProj
      d.inProj = [-x, -y]
    })

    state.neurons.forEach(d => {
      // var doubled = state.neurons[d.i*2 % state.n_neurons]
      d.outθ = d.inθ*2
      var [x, y] = d.inProj
      d.outProj = [2*x*x - 1, 2*x*y]

      if (state.n_neurons % 2 == 0 && d.i >= state.n_neurons/2){
        // d.color = state.neurons[d.i - state.n_neurons/2].color
        // d.isDash = true
      }
    })
  }
  initModel()

  state.renderAll.input.fns.push(() => {
    var aPos = state.embed[state.a]
    var bPos = state.embed[state.b]
    var meanPos = [
      d3.mean([aPos[0], bPos[0]]),
      d3.mean([aPos[1], bPos[1]]),
    ]

    state.neurons.forEach(d => {
      var preV = calcDot(d.inProj, meanPos)
      d.val = Math.max(0, preV)
      // d.val = preV*preV
      d.outPos = mul(d.outProj, d.val)
    })

    state.outSumPos = sum(state.neurons.map(d => d.outPos))

    Object.assign(state, {aPos, bPos, meanPos})

    function mul(v, mag){
      return v.map(d => d*mag)
    }

    function sum(v){
      var a = d3.sum(v, d => d[0])
      var b = d3.sum(v, d => d[1])
      return [a, b]
    }

    function calcDot(u, v){
      return u[0]*v[0] + u[1]*v[1]
    }
  })

  state.renderAll.input()

  state.allOutSumPos = d3.range(n_tokens).map(i => {
    state.a = i
    state.b = (i + 0)  % n_tokens
    state.correct = (state.a + state.b) % n_tokens

    state.renderAll.input()

    return {
      correct: state.correct, 
      pos: state.outSumPos,
      // correctAngle: state.correct/n_tokens*Math.PI*2,
      correctAngle: posToAngle(state.embed[state.correct]),
      outputAngle: posToAngle(state.outSumPos),
    }

    function posToAngle([x, y]){
      return Math.atan2(y, x)
    }
  })

  state.allOutSumPos.forEach(d => {
    d.angleDiff = d.outputAngle - d.correctAngle

    d.numCorrect = d.correctAngle*n_tokens/Math.PI/2
    d.numOutput = d.outputAngle*n_tokens/Math.PI/2
    d.numDiff = d.numOutput - d.numCorrect

    if (d.numDiff > n_tokens/2)  d.numDiff = (d.numDiff - state.n_tokens) % d.numDiff
    if (d.numDiff < -n_tokens/2) d.numDiff = (d.numDiff + state.n_tokens) % d.numDiff
  })

  state.a = 2
  state.b = 12


  window.initFullInputSliders({
    sel: d3.select('.slider-container').html(''),
    state,
  })

  var circleSel = d3.select('.circle-vis').html('').classed('appendix', 1)
  initCircleWeightsVis({
    state,
    type: 'embed',
    title: 'embed',
    caption: 'First, project the two input points around a circle and average their positions.',
    sel: circleSel.append('div')
  })
  initCircleWeightsVis({
    state,
    type: 'unembed',
    title: 'unembed',
    caption: 'Then, double the angle with the unembedding. The answer is the point closest to the averaged position.',
    sel: circleSel.append('div')
  })

  var projSel = d3.select('.proj-vis').html('').classed('appendix', 1)
  initProjVis({
    state,
    type: 'inProj',
    title: 'embed, in-proj and ReLU ',
    caption: `First, project the averaged position along ${state.n_neurons} evenly spaced directions <span class='directions-caption'></span> and apply a ReLU to keep only the positive components.`,
    sel: projSel.append('div')
  })
  initProjVis({
    state,
    type: 'outProj',
    title: 'out-proj and unembed',
    caption: `Then, rotate the ${state.n_neurons} directions around the circle twice as fast. The answer is the point on the circle closest to sum of the positive projections.`,
    sel: projSel.append('div')
  })

  var debugSel = d3.select('.debug-vis').html('').classed('appendix', 1)
  initDebugVis({
    state,
    type: 'outProj',
    title: 'Every out-proj and unembed',
    caption: `
      The error goes to 0 when the angle aligns with a direction; an odd number of neurons is more accurate.
      <br><br>
      In our sweep of models trained from scratch, 5 is the most common number of neurons in a frequency. Frequencies with 6 neurons are typically closer lopsided pentagons than hexagons. 
    `,
    sel: debugSel.append('div')
  })

  initLineErrorVis({
    state,
    title: 'Small Errors',
    // caption: `Then, rotate the ${state.n_neurons} directions around the circle twice as fast. The answer is the point on the circle closest to sum of the positive projections.`,
    sel: debugSel.append('div')
  })

  util.addAria([
    {selector: '.slider-container', label: `Sliders to pick inputs a and b`},
    {selector: '.circle-vis', label: `First, project the two input points around a circle and average their positions. Then, double the angle with the unembedding. The answer is the point closest to the averaged position.`},
    {selector: '.proj-vis', label: `First, project the averaged position along 5 evenly spaced directions and apply a ReLU to keep only the positive components. Then, rotate the 5 directions around the circle twice as fast. The answer is the point on the circle closest to sum of the positive projections.`},
    {selector: '.debug-vis', label: `The error goes to 0 when the angle aligns with a direction; an odd number of neurons is more accurate. In our sweep of models trained from scratch, 5 is the most common number of neurons in a frequency. Frequencies with 6 neurons are typically closer lopsided pentagons than hexagons.`},
  ])




  // var debugReuleauxSel = d3.select('.debug-reuleaux').html('').classed('appendix', 1)
  // initDebugReuleaux({
  //   state,
  //   type: 'outProj',
  //   title: 'reuleaux',
  //   caption: `
  //     ???
  //   `,
  //   sel: debugReuleauxSel.append('div')
  // })



  state.renderAll.input.fns.push(() => {
    d3.selectAll('v').text(state.correct)
    d3.selectAll('v2').text(state.correct + state.n_tokens)
  })

  state.renderAll.input()
  state.renderAll.model()
}
window.initAppendix()


d3.select('.n_neurons').on('change', function(){
  appendixState.n_neurons = +this.value
  initAppendix()
})

d3.select('.modulus').on('change', function(){
  appendixState.n_tokens = +this.value
  appendixState.a = appendixState.a % appendixState.n_tokens
  appendixState.b = appendixState.b % appendixState.n_tokens
  initAppendix()
})


d3.select('body').selectAppend('div.svg-arrow-appendix').html(`
  <svg viewBox='0 0 300 100' >
    <defs>
      <marker id='arrow-appendix' viewBox='0 0 10 10' refX='5' refY='5' markerWidth='6' markerHeight='6' fill='#000' orient='auto-start-reverse'>
        <path d='M 0 0 L 10 5 L 0 10 z' />
      </marker>
    </defs>
  </svg>
`)
