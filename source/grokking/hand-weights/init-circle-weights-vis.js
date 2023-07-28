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


window.initCircleWeightsVis = async function({type, state}){
  var c = d3.conventions({
    sel: d3.select('.circle-' + type).html(''),
    width:  160,
    height: 160,
    layers: 's',
  })

  c.yAxis.ticks(3)
  c.xAxis.ticks(3)
  // d3.drawAxis(c)
  // c.svg.select('.x').translate([Math.floor(sx/2), c.height])
  // c.svg.select('.y').translate(Math.floor(sy/2), 1)

  // var ogType = type
  // if (type == 'outW-embed') type = 'embed'
  
  c.svg.append('text').text(type)
    .at({y: -5, fontSize: 12})

  var isEmbed = type == 'embed'
    
  var pointData = d3.range(type == 'embed' ? state.n_tokens : state.hidden_size)
    .map(i => ({i}))

  var lineSel = c.svg.appendMany('path', pointData)
    .at({stroke: '#000', opacity: isEmbed ? 0 : 1})

  var pointSel = c.svg.appendMany('g', pointData)

  var textSel = pointSel.append('text').text(d => d.i)
    .at({textAnchor: 'middle', dy: '.33em', fontSize: isEmbed ? 10 : ''})
  pointSel.append('circle').at({r: 3})

  state.renderAll.model.fns.push(render)

  function render(){
    var hiddenW = state.model.hiddenWT
    var outW = state.model.outW

    var max = d3.max(hiddenW.concat(outW).flat().map(Math.abs))

    c.svg.selectAll('rect, .axis').remove()
    c.x.domain([-max*1.3, max*1.3])
    c.y.domain([-max*1.3, max*1.3])
    d3.drawAxis(c)
    util.ggPlot(c)

    c.svg.append('circle')
      .translate([c.width/2, c.height/2]).at({r: c.x(max*.7)/2, stroke: '#ccc', fill: 'none'})

    pointSel.raise()

    pointData.forEach(d => {
      d.pos = state.model[type][d.i]
    })

    lineSel.raise().at({
      d: d => ['M', c.x(0), c.y(0), 'L', c.x(d.pos[0]), c.y(d.pos[1])].join(' ')
    })


    pointSel.translate(d => [c.x(d.pos[0]), c.y(d.pos[1])])

    textSel.translate(d => [d.pos[0]*10, -d.pos[1]*10])
  }
}


window.initHandWeights?.()
