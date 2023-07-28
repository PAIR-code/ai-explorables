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


window.initCircleWeightsFreqs= async function({state, type, title}){

  title = type
  var freq = state.model[type]
  freq.forEach((d, i) => {
    d.cos = d[0]
    d.sin = d[1]
    d.prev = freq.at(i - 1)
    d.angleIndex = i
  })
  freq.key = 0

  var freqSel = d3.select('.circle-' + type).html('')
    .each(drawFreqChart)

  function drawFreqChart(){

    var c = d3.conventions({
      sel: d3.select(this).html('').st({display: 'inline-block'}),
      width: 150,
      height: 150,
      margin: {bottom: 35},
    })

    c.xAxis.ticks(3)
    c.yAxis.ticks(3)
    d3.drawAxis(c)
    util.ggPlot(c)
    

    c.svg.append('text.chart-title').at({y: -5})
      .text('W_' + type.replace('hidden', 'in-projᵀ').replace('out', 'out-proj').replace('W', '').replace('T', ''))

    var axisLabel = type.includes('out') ? 'Output' : 'Input'
    util.addAxisLabel(c, axisLabel + ' Cos Component', axisLabel + ' Sin Component', 25, -15)

    var axisCircle = c.svg.append('circle')
      .translate([c.x(.5), c.y(.5)])
      .at({fill: 'none', stroke: '#fff'})

    var prevLineSel = c.svg.appendMany('path', freq)
      .at({stroke: '#000', fill: 'none'})

    var dimSel = c.svg.appendMany('g.dimension-dft', freq)
    dimSel.append('circle')
      .at({r: 6, fill: '#000'})
    dimSel.append('text').text(d => d.angleIndex)
      .at({dy: '.33em', textAnchor: 'middle', fill: '#fff'})

    function render(){
      var norm = 1
      
      c.x.domain([-norm*1.2, norm*1.2])
      c.y.domain([-norm*1.2, norm*1.2])
      c.svg.select('.x').call(c.xAxis)
      c.svg.select('.y').call(c.yAxis)
      util.ggPlotUpdate(c)

      axisCircle.at({r: c.x(-norm*1.2 + norm)})

      freq.forEach(d => {
        var {cos, sin} = d
        d.pos = [c.x(cos), c.y(sin)]
      })

      prevLineSel.at({d: d => ['M', d.pos, 'L', d.prev.pos].join(' ')})

      dimSel.translate(d => d.pos)
    }
    render()
  }
}


window.initHandWeights?.()
