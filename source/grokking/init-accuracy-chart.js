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


window.initAccuracyChart = async function({sel, state, isBig=true, isLoss, width=null, title=null, yExtent=[1e1, 1e-7]}){
  var c = d3.conventions({
    sel: sel.html('').append('div'),
    width: width || (isBig ? 442 : 50),
    height: isBig ? 150 : 30,
    margin: {left: 25, right: 15, top: 25, bottom: 30}
  })

  c.x.domain([0, state.hyper.max_steps])
  if (isLoss){
    c.y = d3.scaleLog().domain(yExtent).range([0, c.height])
    c.yAxis = d3.axisLeft(c.y)
  } else {
    
    if (state.hyper.task == 'sparse_parity'){
      c.y.domain([.45, 1])
    } else{
      c.y.domain([0, 1])
    }
    c.yAxis.tickFormat(d3.format('.0%'))
  }

  c.xAxis.ticks(isBig ? 10 : 3).tickFormat(d3.format(','))
  c.yAxis.ticks(isBig ? 5 : 3)

  d3.drawAxis(c)
  c.svg.select('.y').lower()
  util.ggPlot(c)

  c.svg.append('text.chart-title').at({y: -7, fontSize: 12, textAnchor: 'middle', x: c.width/2})
    .text(title || ((isLoss ? 'Loss' : 'Accuracy') + ' Over Training'))

  util.addAxisLabel(c, 'Training Step →', isLoss ? 'Loss' : 'Accuracy')

  var line = d3.line().x(d => c.x(d.step))

  var trainPathSel = c.svg.append('path')
    .at({strokeWidth: 2, stroke: util.colors.train, fill: 'none'})
  var evalPathSel = c.svg.append('path')
    .at({strokeWidth: 2, stroke: util.colors.test, fill: 'none'})

  var metrics = await util.getFile(state.modelPath + '/metrics.json')
  state.metrics = metrics 
  // TODO: load in init (or have each component handle own data?)

  var datakey = isLoss ? 'loss' : 'acc'
  trainPathSel.at({d: line.y(d => c.y(d['train_' + datakey]))(metrics)})
  evalPathSel .at({d: line.y(d => c.y(d['eval_' + datakey]))(metrics)})

  var hoverTick = c.svg.select('.x .tick')
    .select(function(){ return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling) })
    .st({opacity: 1}).classed('step-path', 1)
    .raise()

  hoverTick.select('text').st({fill: '#000', fontWeight: 500})
  hoverTick.select('path').at({d: 'M 0 0 V ' + -c.height, stroke: '#000', strokeDasharray: '3 2'})

  state.renderAll.step.fns.push(d => {
    var step = state.stepIndex*state.hyper.save_every

    hoverTick.translate(c.x(step), 0)
    hoverTick.select('text').text(d3.format(',')(step))
  })

  c.svg.append('rect')
    .at({width: c.width, height: c.height + 30, fillOpacity: 0})
    .on('mousemove touchmove', function(){
      d3.event.preventDefault()

      // last training run missing on some models
      var mouseX = d3.clamp(0, d3.mouse(this)[0], c.width - .1)
      state.stepIndex = Math.floor(c.x.clamp(1).invert(mouseX)/state.hyper.save_every)
      state.renderAll.step()
    })


  if (title?.includes('Sudden Generalization')) return

  var labelKey = state.hyper.task + '_' + state.slug + '_' + (!!isLoss)
  var labelOffsets = {
    'modular_addition_2023_07_09_19_38_17-index_false': [[260, 115], [7, 50]],
    'modular_addition_2023_07_09_19_38_17-index_true': [[305, 80], [30, 115]],
    'sparse_parity_2023_07_05_19_45_20_false': [[189, 132], [60, 50]],
    'sparse_parity_2023_07_05_19_45_20_true': [[134, 32], [40, 80]],

    // openQ
    'modular_addition_2023_07_22_20_25_47_true': [[300, 32], [125, 80]],
    'modular_addition_2023_07_22_20_37_01_true': [[300, 42], [40, 115]],
  }[labelKey]

  if (labelOffsets){
    c.svg.appendMany('text', labelOffsets)
      .text((d, i) => (i ? 'Train' : 'Test') + ' ' + (isLoss ? 'Loss' : 'Accuracy'))
      .st({fill: (d, i) => i ? util.colors.train : util.colors.test, pointerEvents: 'none'})
      .translate(d => d)
      .classed('overlay-chart-label', 1)
    } else{
      // console.log(labelKey)
    }
}

window.initModTop?.()
// window.initSparseParity?.()
window.initModBot?.()

// window.initOpenQMem0()
// window.initOpenQMem1?.()



