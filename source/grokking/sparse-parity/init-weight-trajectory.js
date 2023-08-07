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


window.initParityWeightsTrajectory = async function({state, sel, type}){
  var c = d3.conventions({
    sel: sel.html('').append('div'),
    width: 442,
    height: 150,
    margin: {left: 25, right: 15, top: 22, bottom: 30}
  })

  c.x.domain([0, state.hyper.max_steps])
  c.y.domain([-3, 3])

  c.xAxis.ticks(10).tickFormat(d3.format(','))
  c.yAxis.ticks(5)

  d3.drawAxis(c)
  util.ggPlot(c)

  c.svg.append('text.chart-title').at({y: -5, fontSize: 12, xz: c.width/2, textAnchorz: 'middle'})
    .text(util.titleFmt('hidden_w Over Training'))

  util.addAxisLabel(c, 'Training Steps →', 'Weight Value', 30, -20)



  var {data, shape} = state[type]

  var weightArray = d3.cross(d3.range(shape[1]), d3.range(shape[2]))

  weightArray.forEach(weight => {
    var [i, j] = weight
    weight.trajectory = d3.range(shape[0]).map(stepIndex => {
      var offset = shape[1]*shape[2]*stepIndex
      return data[offset + shape[2]*i + j]
    })

    weight.isTopK = i < 3
    weight.isBias = i == 30
    // weight.isTopK = Math.abs(_.last(weight.trajectory)) > 1
  })
  weightArray = _.sortBy(weightArray, d => d.isBias ? -1 : 1)

  var line = d3.line()
    .x((d, i) => c.x(i*state.hyper.save_every))
    .y(c.y)

  c.svg.appendMany('path', weightArray)
    .at({
      stroke: d => d.isTopK ? util.colors.highlight : d.isBias ? 'pink' : '#000',
      opacity: d => d.isTopK || d.isBias ? 1 : .1,
      fill: 'none',
      d: d => line(d.trajectory)
    })

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
    .at({width: c.width, height: c.height, fillOpacity: 0})
    .on('mousemove', function(){
      state.stepIndex = Math.floor(c.x.invert(d3.mouse(this)[0])/state.hyper.save_every)
      state.stepIndex = Math.max(0, state.stepIndex)
      state.renderAll.step()
    })


  var legendSel = c.svg.append('g.axis')
    .translate([c.width + 20, c.height/2 - 15])
    .appendMany('g', [
      {str: 'First Three Digits', color: util.colors.highlight},
      {str: 'Distraction Digits', color: '#999'},
      {str: 'Bias Term', color: 'pink'},
    ])
    .translate((d, i) => i*15, 1)

  legendSel.append('path')
    .at({stroke: d => d.color, d: 'M 0 0 H 20', strokeWidth: 2})

  legendSel.append('text.axis-label').text(d => d.str)
    .translate(25, 0).at({dy: '.33em'})
}


window.initSparseParity?.()
