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


window.initModBotFreqs= async function({state, sel, stepsKey, title}){

  var freqSel = sel.html('')
    .appendMany('div', state.byFreq)
    .st({width: 400})
    .each(drawFreqChart)

  freqSel.style(stepsKey == 'stepsOut' ? 'padding-bottom' : 'padding-top', '5px')

  function drawFreqChart(freq, chartIndex){
    var c = d3.conventions({
      sel: d3.select(this).html('').st({display: 'inline-block'}),
      width: 150,
      height: 150,
    })

    c.xAxis.ticks(5)
    c.yAxis.ticks(5)
    d3.drawAxis(c)
    util.ggPlot(c)

    c.svg.append('text.chart-title').at({y: -5})
      .text(util.titleFmt(title) + ' — Frequency ' + (+freq.key + 1))

    var axisLabel = title.includes('out') ? 'Output' : 'Input'
    util.addAxisLabel(c, axisLabel + ' Cos Component', chartIndex ? '' : axisLabel + ' Sin Component', 25, -23)

    var axisCircle = c.svg.append('circle')
      .translate([c.x(.5), c.y(.5)])
      .at({fill: 'none', stroke: '#fff'})

    var prevLineSel = c.svg.appendMany('path.dimension-prev', freq)
      .at({stroke: '#000', fill: 'none'})

    var dimSel = c.svg.appendMany('g.dimension-dft', freq)
      .on('mouseover', d => {
        state.dim = d.index
        state.renderAll.dim()
      })
    c.svg.on('mouseleave', () => {state.dim = -1; state.renderAll.dim() })

    dimSel.append('circle')
      .at({r: 7, fill: '#000'})
    dimSel.append('text').text(d => d.angleIndex)
      .at({dy: '.33em', textAnchor: 'middle', fill: '#fff'})

    state.renderAll.step.fns.push(() => {
      var norm = d3.mean(freq, d => d[stepsKey][state.stepIndex].norm)
      
      c.x.domain([-norm*1.2, norm*1.2])
      c.y.domain([-norm*1.2, norm*1.2])
      c.svg.select('.x').call(c.xAxis)
      c.svg.select('.y').call(c.yAxis)
      util.ggPlotUpdate(c)

      axisCircle.at({r: c.x(-norm*1.2 + norm)})

      freq.forEach(d => {
        var {cos, sin} = d[stepsKey][state.stepIndex]
        d.pos = [c.x(cos), c.y(sin)]
      })

      prevLineSel.at({d: d => ['M', d.pos, 'L', d.prev.pos].join(' ')})
      
      dimSel.translate(d => d.pos)
    })

    state.renderAll.dim?.fns.push(() => {
      dimSel.classed('active', d => d.index == state.dim)
      prevLineSel.classed('active', d => d.index == state.dim || d.prev.index == state.dim)
    })

  }
}


window.initModBot?.()
