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


window.initFiveCircle = async function({type, state, sel, permute}){
  var title = type

  var c = d3.conventions({
    sel: sel.append('div'),
    width:  150,
    height: 150,
    layers: 's',
    margin: {bottom: 40},
  })

  c.yAxis.ticks(3)
  c.xAxis.ticks(3)
  d3.drawAxis(c)
  util.ggPlot(c)
  
  c.svg.append('text.chart-title').at({y: -5})    
    .text(util.titleFmt(type))

  var axisLabel = title.includes('out') ? 'Output' : 'Input'
  util.addAxisLabel(c, axisLabel + ' Cos Component', axisLabel + ' Sin Component', 25, -23)

  var axisCircle = c.svg.append('circle')
    .translate([c.x(.5), c.y(.5)])
    .at({fill: 'none', stroke: '#fff'})

  var pointData = d3.range(5).map(i => ({i, index: i, label: i}))
  pointData.forEach(d => d.prev = d)
  if (permute){
    pointData = _.sortBy(pointData, d => permute.indexOf(d.i))
    pointData.forEach((d, i) => d.prev = pointData[(i + 1) % 5])
    // pointData.forEach((d, i) => d.label = 'ABCDE'[i])
  }

  var prevLineSel = c.svg.appendMany('path.dimension-prev', pointData)
    .at({stroke: '#000', fill: 'none'})

  var dimSel = c.svg.appendMany('g.dimension-dft', pointData)
    .on('mouseover', d => {
      state.dim = d.index
      state.renderAll.dim()
    })
  c.svg.on('mouseleave', () => {state.dim = -1; state.renderAll.dim() })

  dimSel.append('circle')
    .at({r: 7, fill: '#000'})
  dimSel.append('text').text(d => d.label)
    .at({dy: '.33em', textAnchor: 'middle', fill: '#fff'})


  state.renderAll.step.fns.push(render)

  function render(){
    var max = state.maxY

    c.x.domain([-max*1.2, max*1.2])
    c.y.domain([-max*1.2, max*1.2])
    c.svg.select('.x').call(c.xAxis)
    c.svg.select('.y').call(c.yAxis)
    util.ggPlotUpdate(c)

    axisCircle.at({r: c.x(-max*1.2 + max)})

    pointData.forEach(d => {
      var [x, y] = state.model[type][d.i]
      d.pos = [c.x(x), c.y(y)]
    })

    dimSel.translate(d => d.pos)
    prevLineSel.at({d: d => ['M', d.pos, 'L', d.prev.pos].join(' ')})
  }

  state.renderAll.dim?.fns.push(() => {
    dimSel.classed('active', d => d.index == state.dim)
    prevLineSel.classed('active', d => d.index == state.dim || d.prev.index == state.dim)
  })
}


window.initFiveNeurons?.()
