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


window.initActivationVis = async function(state){

  var renderAll = state.renderAll
  var s = 2
  var hiddenData = d3.range(state.hidden_size).map(i => ({i}))

  var hiddenSel = d3.select('.activation-vis').html('')
    .appendMany('div', hiddenData)
    .st({display: 'inline-block'})
    .each(initHidden)
    .each(initOut)

  initSum()
  
  function initHidden(d){
    var c = d3.conventions({
      sel: d3.select(this).append('div'),
      width:  (state.n_tokens - 1)*s,
      height: (state.n_tokens - 1)*s,
      layers: 'scs',
      margin: {bottom: 30, top: 30}
    })

    c.svg.append('text').text('Neuron ' + d.i)
      .at({y: -2, fontSize: 12})

    var valTextSel = c.svg.append('text')
      .at({y: -2, fontSize: 12, x: c.width, textAnchor: 'end'})

    c.x.domain([0, state.n_tokens - 1])
    c.y.domain([0, state.n_tokens - 1])

    c.xAxis.ticks(5)
    c.yAxis.ticks(5)
    d3.drawAxis(c)

    var hoverTickA = c.svg.select('.x .tick')
      .select(function(){ return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling) })
      .raise().classed('hover-tick', 1)

    var hoverTickB = c.svg.select('.y .tick')
      .select(function(){ return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling) })
      .raise().classed('hover-tick', 1)

    util.addAxisLabel(c, 'Input a', d.i ? '' : 'Input b', 25, -24)

    var hoverSel = c.layers[2].append('circle')
      .at({stroke: '#000', r: s, fill: 'none'})

    c.layers[2].append('rect')
      .at({width: c.width + s*2, height: c.height + s*2, x: -s, y: -s, fillOpacity: 0})
      .on('mousemove', function(){
        if (!state.isLocked) updatePos.call(this)
      })
      .on('click', function(){
        state.isLocked = !state.isLocked
        updatePos.call(this)
      })
      .on('mouseleave', function(){
        state.isLocked = false
      })

    function updatePos(){
      var mPos = d3.mouse(this)
      state.a = Math.round(c.x.invert(mPos[0])) % state.n_tokens
      state.b = Math.round(c.y.invert(mPos[1])) % state.n_tokens
      state.a = Math.max(0, state.a)
      state.b = Math.max(0, state.b)

      renderAll.input()
    }

    d.hidden = {c, ctx: c.layers[1], hoverSel, valTextSel, i: d.i, hoverTickA, hoverTickB}
  }

  function initOut(d){
    var c = d3.conventions({
      sel: d3.select(this).append('div.out'),
      width:  (state.n_tokens - 1)*s,
      height: 100,
    })
    c.x.domain([0, state.n_tokens - 1])

    var valTextSel = c.svg.append('text')
      .at({y: -2, fontSize: 12})

    var lineSel = c.svg.appendMany('path', d3.range(state.n_tokens))
      .at({stroke: '#000', strokeWidth: 1.5})
      .translate(c.x, 0)

    d.out = {c, lineSel, i: d.i, valTextSel}
  }

  function initSum(){
    var c = d3.conventions({
      sel: d3.select('.activation-vis').append('div.row').append('div'),
      width:  (state.n_tokens - 1)*s,
      height: 100,
      margin: {top: 0}
    })
    c.x.domain([0, state.n_tokens - 1])

    c.svg.append('text').text('Logits Sum')
      .at({y: -2, fontSize: 12})

    var lineSel = c.svg.appendMany('path', d3.range(state.n_tokens))
      .at({stroke: '#000', strokeWidth: 1.5})
      .translate(c.x, 0)

    hiddenData.sum = {c, lineSel}
  }


  var color = d => d3.interpolateRdBu((-d + 2) / 2 / 2)

  renderAll.model.fns.push(render)

  function render(){
    var hiddenW = state.model.hiddenWT
    var outW = state.model.outW

    // Assuming W_embed and W_hidden are 2D arrays in JavaScript

    // Convert arrays to tensor2D
    var embed_tf = tf.tensor2d(state.model.embed)
    var W_hidden_tf = tf.tensor2d(state.model.hiddenW)
    var W_out_tf = tf.tensor2d(state.model.outW)

    var W_hidden_embed = tf.matMul(embed_tf, W_hidden_tf)
    var expand0 = W_hidden_embed.expandDims(1)
    var expand1 = W_hidden_embed.expandDims(0)
    var activations = tf.add(expand0, expand1).relu().transpose([2, 0, 1])
    
    hiddenData.activations = activations.arraySync()

    var outW_embedW = tf.matMul(W_out_tf, embed_tf.transpose())
    hiddenData.outW_embedW = outW_embedW.arraySync()

    hiddenData.forEach(hidden => {
      var {hidden: {c, ctx}, i} = hidden
      hiddenData.activations[i].forEach((row, i) => {
        row.forEach((v, j) => {
          ctx.beginPath()
          ctx.fillStyle = v == 0 ? '#ccc' : color(v)
          // ctx.fillStyle = v == 0 ? '#F1F3F4' : color(v)
          ctx.rect(c.x(i), c.y(j), s - .1, s -.1)
          ctx.fill()
        })
      })
    })


    hiddenData.maxVal = d3.max(hiddenData.activations.flat(2))*d3.max(hiddenData.outW_embedW.flat(2))
    hiddenData.forEach(hidden => {
      var {c, lineSel} = hidden.out

      c.y.domain([-hiddenData.maxVal, hiddenData.maxVal])
      c.xAxis.ticks(5)
      c.yAxis.ticks(5)
      d3.drawAxis(c)
      util.ggPlot(c)
      lineSel.raise()

      hidden.out.hoverTick = c.svg.select('.x .tick')
        .select(function(){ return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling) })
        .raise().classed('correct-tick', 1)

      util.addAxisLabel(c, 'Output Number', hidden.i ? '' : 'Logits', 28, -20)
    })


    !(function(){
      var {c, lineSel} = hiddenData.sum

      c.y.domain([-hiddenData.maxVal, hiddenData.maxVal])
      c.xAxis.ticks(5)
      c.yAxis.ticks(5)
      d3.drawAxis(c)
      util.ggPlot(c)
      lineSel.raise()

      hiddenData.sum.hoverTick = c.svg.select('.x .tick')
        .select(function(){ return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling) })
        .raise().classed('correct-tick', 1)

      util.addAxisLabel(c, 'Output Number', 'Logits', 28, -20)
      
    })()

    renderAll.input()
  }


  renderAll.input.fns.push(() => {
    state.correct = (state.a + state.b) % state.n_tokens

    hiddenData.forEach(({hidden}) => {
      var {c, hoverSel, valTextSel, i} = hidden
      hoverSel
        .translate(d => [c.x(state.a), c.y(state.b)])

      hidden.hoverTickA.translate(c.x(state.a), 0).select('text').text(state.a)
      hidden.hoverTickB.translate(c.y(state.b), 1).select('text').text(state.b)

      hidden.val = hiddenData.activations[i][state.a][state.b]
      valTextSel.text(d3.format('.2f')(hidden.val))
    })


    hiddenData.forEach(({hidden, out}, i) => {
      var {c, lineSel, i} = out

      out.vals = hiddenData.outW_embedW[i].map(d => d*hidden.val)

      var valStr = d3.format('.2f')(hidden.val)
      out.valTextSel.text(`${valStr}×W_out_${i}×W_embedᵀ`)

      lineSel.at({
        d: d => `M 0 ${c.y(0)} V ${c.y(out.vals[d])}`,
        stroke: d => d == state.correct ? util.colors.correct : '#000',
      })

      out.hoverTick.translate(c.x(state.correct), 0).select('text').text(state.correct)
    })

    !(function(){
      var {c, lineSel} = hiddenData.sum

      var vals = d3.range(state.n_tokens).map(i => {
        return d3.sum(d3.range(state.hidden_size).map(j => hiddenData[j].out.vals[i]))
      })

      lineSel.at({
        d: d => `M 0 ${c.y(0)} V ${c.y(vals[d])}`,
        stroke: d => d == state.correct ? util.colors.correct : '#000',
      })

      hiddenData.sum.hoverTick.translate(c.x(state.correct), 0).select('text').text(state.correct)
    })()
  })

}


window.initHandWeights?.()













