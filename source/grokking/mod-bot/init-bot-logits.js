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


window.initModBotLogits= async function({state, sel, stepsKey}){

  sel.html('').append('div').appendMany('div', state.byFreq)
    .each(drawFreqChart)

  sel.appendMany('div.all-logits', [0])
    .st({display: 'block', textAlign: 'center'}).append('div')
    .each(drawFreqChart)

  function drawFreqChart(freq, chartIndex){
    var c = d3.conventions({
      sel: d3.select(this).html('').st({display: 'inline-block'}),
      width: 67*2,
      height: 100,
    })

    c.x.domain([0, state.n_tokens - 1])
    c.xAxis.ticks(5)
    c.yAxis.ticks(5)
    d3.drawAxis(c)
    util.ggPlot(c)

    var hoverTick = c.svg.select('.x .tick')
      .select(function(){ return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling) })
      .raise().classed('correct-tick', 1)

    c.svg.append('text.chart-title').at({y: -5})
      .text((freq ? 'Frequency ' + (+freq.key + 1) : 'All') +  ' Logits')
      
    util.addAxisLabel(c, 'Output Number', chartIndex ? '' : 'Logit', 24, -20)

    var lineSel = c.svg.appendMany('path', d3.range(state.n_tokens))
      .at({stroke: '#000', strokeWidth: 2})
      .translate(c.x, 0)

    state.renderAll.input.fns.push(() => {
      var logits = model(!freq ? 0 : freq.map(d => d.index)).logits.dataSync()
      var correct = (state.a + state.b) % state.n_tokens

      var maxVal = d3.max(logits, Math.abs)
      c.svg.select('.y').call(c.yAxis)
      c.y.domain([-maxVal, maxVal])
      util.ggPlotUpdate(c)

      lineSel.at({
        d: d => `M 0 ${c.y(0)} V ${c.y(logits[d])}`,
        stroke: d => d == correct ? util.colors.correct : '#000',
      })

      hoverTick.translate(c.x(correct), 0).select('text').text(correct)
    })
  }

  state.renderAll.step.fns.push(() => {
    updateTfWeights()
    state.renderAll.input()
  })

  function updateTfWeights(){
    state.tfHidden = util.npy2tfSlice(state.hidden_embed_w, state.stepIndex)
    state.tfOut = util.npy2tfSlice(state.out_embed_t_w, state.stepIndex).transpose()
  }

  function model(freqHiddenDims){
    var x = tf.tensor2d([state.a, state.b], [1, 2], 'int32')

    var hidden = tf.oneHot(x, state.n_tokens)
      .sum(1)
      .matMul(state.tfHidden)
      .relu()

    if (freqHiddenDims){
      var mask = tf.oneHot(freqHiddenDims, state.tfHidden.shape[1]).sum(0)
      var maskedHidden = hidden.mul(mask)
    } else {
      maskedHidden = hidden
    }
    var logits = maskedHidden.matMul(state.tfOut)

    return {logits}
    // return {hidden, maskedHidden, logits}
  }

  updateTfWeights()

  var output = model(state.byFreq[0])
}


window.initModBot?.()
