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


window.initEmbedVis = async function({state, sel, type, sx=3, sy=3, maxY=3, yAxisLabel='Neuron', xAxisLabel='Input Number', isTiny=false, isNoStep=false}){
  var {data, shape} = state[type]
  var isRescale = maxY == 'rescale'
  if (isRescale) maxY = 2

  var isCos = isNoStep

  var c = d3.conventions({
    sel: sel.html('').append('div'),
    width:  shape[1]*sx,
    height: shape[2]*sy,
    layers: 'scs',
    margin: {top: 22, bottom: 32},
  })

  var ctx = c.layers[1]
  c.x.range([0, sx*shape[1]]).domain([0, shape[1]])
  c.y.range([0, sy*shape[2]]).domain([0, shape[2]])

  c.xAxis.ticks(5)
  c.yAxis.ticks(5)
  if (isCos) c.xAxis.tickValues([0, 1]).tickFormat(d => ['Cos', 'Sin'][d])

  d3.drawAxis(c)
  c.svg.select('.x').translate([Math.floor(sx/2), c.height])
  c.svg.select('.y').translate(Math.floor(sy/2), 1)

  if (type.includes('dft')){
    c.svg.select('.x').translate([0, c.height])
      .selectAll('text').text(d => d/2)
    c.svg.select('.x .tick').remove()
  }
  if (state.hyper.task == 'sparse_parity'){
    c.svg.select('.x')
      .selectAll('text').text(d => d == 30 ? 'Bias' : d)
  }
  c.svg.selectAll('.y .tick').filter(d => d == shape[2]).remove()

  c.svg.append('text.chart-title').at({y: -5, fontSize: 12})
    .text(util.titleFmt(type))

  // TODO: frequency ticks
  var stepLabelSel = c.svg.append('text')
    .at({textAnchor: 'end', x: c.width, y: -5, fontSize: 12, opacity: isTiny || isNoStep ? 0 : 1})

  util.addAxisLabel(c, xAxisLabel, yAxisLabel, 26, -25)
  if (isCos) c.svg.select('.x .axis-label').translate(-10, 0)

  if (isTiny) c.svg.selectAll('.tick').remove()
  if (isCos){
    c.svg.append('rect').at({width: c.width + .6, height: c.height + .6, x: -.5, y: -.5})
  } else {
    c.svg.append('rect').at({fill: '#aaa', width: c.width + .2, height: c.height + .2, x: -.2, y: -.2})
  }


  var color = d => d3.interpolateRdBu((-d + maxY)/maxY/2)
  state.renderAll.step.fns.push(() => {
    stepLabelSel.text((c.width > 200 ? 'Training Step ' : 'Step ') + d3.format('05,')(state.stepIndex*state.hyper.save_every))
    ctx.clearRect(0, 0, c.width, c.height)

    if (isRescale){
      maxY = state.maxY*1.2
      if (type == 'out_embed_t_w' || type == 'w_outproj') drawLegend(1)
    }
    
    var offset = shape[1]*shape[2]*state.stepIndex
    var pad = isCos ? .5 : .1
    for (var i = 0; i < shape[1]; i++){
      for (var j = 0; j < shape[2]; j++){
        var index = offset + shape[2]*i + j

        ctx.beginPath()
        ctx.fillStyle = color(data[index])
        ctx.rect(i*sx, j*sy, sx - pad, sy - pad)
        ctx.fill()
      }
    }
  })


  // highlight active dim
  var hoverTick = c.svg.select('.y .tick')
    .select(function(){
      return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling)
    })
    .st({opacity: 0})
    .raise()

  hoverTick.select('text').st({fill: util.colors.highlight, fontWeight: 800, fontSize: 12}).at({x: -7})
  hoverTick.select('line').st({stroke: util.colors.highlight})

  var topSvg = c.layers[2]
    .on('mousemove', function(){
      var y = d3.mouse(this)[1]
      state.dim = Math.floor(y/sy)
      state.renderAll.dim?.()
    })
  topSvg.on('mouseleave', () => {state.dim = -1; state.renderAll.dim?.() })

  var uuid = 'uuid-' + Math.random()
  var holeSel = topSvg.append('mask').at({id: uuid})
    .append('rect').at({width: c.width, height: c.height, fill: '#fff'})
    .parent()
    .append('rect').at({width: c.width, height: c.height, y: 0})

  topSvg.append('rect')
    .at({width: c.width, height: c.height, fillOpacity: .5, mask: `url(#${uuid})`})

  state.renderAll.dim?.fns.push(() => {
    if (state.dim >= 0){
      holeSel.at({y: state.dim*sy, height: sy})
      hoverTick.st({opacity: 1}).translate(sy*state.dim + .5, 1)
      hoverTick.select('text').text(state.dim)
    } else {
      holeSel.at({y: 0, height: c.height})
      hoverTick.st({opacity: 0})
    }
  })

  if (type == 'out_embed_t_w') drawLegend()
  if (type == 'out_w') drawLegend()
  if (type == 'w_outproj') drawLegend()

  function drawLegend(isUpdate){
    var nTicks = c.height
    var y = d3.scaleLinear().domain([-maxY, maxY]).range([c.height, 0])
    var legendSel = topSvg.selectAppend('g.axis.legend').translate(c.width + (type == 'out_w' ? 80 : isCos ? 40 : 20) , 0)

    legendSel.selectAll('text').remove()
    legendSel.appendMany('text', y.ticks(5))
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


window.initModTop?.()
// window.initSparseParity?.()
// window.initModBot?.()

// window.initOpenQMem0()
window.initFiveNeurons?.()
