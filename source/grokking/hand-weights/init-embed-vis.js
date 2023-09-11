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


window.initEmbedCircleVis = async function({type, state, sx=20, sy=20}){
  var data = state.model[type].flat()
  var shape = [state.model[type].length, state.model[type][0].length]

  var ppType = type.replace('T', '')
  var isEmbed = type.includes('embed')
  var isOut = type.includes('out')

  var c = d3.conventions({
    sel: d3.select('.' + ppType).html(''),
    width:  shape[0]*sx,
    height: shape[1]*sy,
    layers: 'sc',
    margin: isEmbed ? {} : {bottom: 30}
  })

  var ctx = c.layers[1]
  c.x.range([0, sx*shape[0]]).domain([0, shape[0]])
  c.y.range([0, sy*shape[1]]).domain([0, shape[1]])


  if (isEmbed){
    // c.xAxis.tickValues([0, 1]).tickFormat(d => ['cos', 'sin'][d])
    // c.yAxis.ticks(4)

    c.y.range([sy*shape[1], 0]).domain([0, shape[1]])
    c.yAxis.tickValues([0, 1]).tickFormat(d => ['Cos', 'Sin'][d])
    c.xAxis.ticks(5)

    d3.drawAxis(c)
    util.addAxisLabel(c, 'Input Number (i)', '')
  } else {
    c.sel.st({marginTop: -20})
    c.xAxis.tickValues([0, 1]).tickFormat(d => ['Cos', 'Sin'][d])
    c.yAxis.tickValues([0, 1, 2, 3, 4]).tickFormat(d => d)

    d3.drawAxis(c)
    if (isOut){
      util.addAxisLabel(c, 'Output', '')
    } else {
      util.addAxisLabel(c, 'Input', 'Neuron')
    }
  }

  c.svg.selectAll('.x').translate([Math.floor(sx/2), c.height])
  c.svg.selectAll('.y').translate(Math.floor(isEmbed ? -sy/2 : sy/2), 1)

  c.svg.select('.x .axis-label').parent().translate([c.width/2 -sx/2, 30])
  c.svg.select('.y .axis-label').parent().translate([-25, c.height/2 - (isEmbed ? -sy/2 : sy/2)])

  c.svg.append('rect').at({width: c.width + .6, height: c.height + .6, x: -.5, y: -.5})

  var typeLabelSel = c.svg.append('text.chart-title').at({y: -5, fontSize: 12, x: c.width/2, textAnchor: 'middle'})
    .text('W_' + ppType.replace('hidden', 'in-projᵀ').replace('out', 'out-proj').replace('W', ''))

  var color = d => d3.interpolateRdBu((-d + 1.5) / 1.5 / 2)

  state.renderAll.model.fns.push(render)

  function render(){
    var offset = 0
    for (var i = 0; i < shape[0]; i++){
      for (var j = 0; j < shape[1]; j++){
        var index = offset + shape[1]*i + j

        ctx.beginPath()
        ctx.fillStyle = color(data[index])
        ctx.rect(i*sx, j*sy, sx - .5, sy - .5)
        ctx.fill()
      }
    }
  }

  drawLegend()
  function drawLegend(isUpdate){
    var nTicks = c.height*2
    var y = d3.scaleLinear().domain([-1, 1]).range([nTicks, 0])
    var legendSel = c.svg.selectAppend('g.axis.legend').translate([c.width + 30, -c.height/2])

    legendSel.selectAll('text').remove()
    legendSel.appendMany('text', y.ticks(2))
      .text(d3.format('+'))
      .at({x: 35, dy: '.33em', y: y, textAnchor: 'end'})

    if (isUpdate) return
    legendSel.appendMany('rect', d3.range(nTicks).map(y.invert))
      .at({
        width: 20,
        height: 1,
        y: (d, i) => i,
        fill: d => color(d)
      })
  }

}


window.initHandWeights?.()
