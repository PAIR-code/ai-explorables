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


window.initCircleWeightsVis = async function({type, state, sel, title, caption}){
  var isEmbed = type == 'embed'
  
  sel = sel.append('div')
  var c = d3.conventions({
    sel: sel.append('div'),
    width:  300,
    height: 300,
    layers: 's',
    margin: {top: 20, bottom: 0},
  })

  sel.append('p.caption').text(caption).st({width: 300})
  c.svg.append('text').text(title)
    .at({y: -5, fontSize: 14, fontWeight: 600})

  c.yAxis.ticks(3)
  c.xAxis.ticks(3)

  var max = 1
  c.svg.selectAll('rect, .axis').remove()
  c.x.domain([-max*1.3, max*1.3])
  c.y.domain([-max*1.3, max*1.3])
  d3.drawAxis(c)
  util.ggPlot(c)
  c.svg.selectAll('.axis text').remove()

  c.xy = ([x, y]) => [c.x(x), c.y(y)]

  c.svg.append('circle')
    .translate(c.xy([0, 0]))
    .at({r: c.x(max*.7)/2, stroke: '#ccc', fill: 'none'})
  
  var pointData = d3.range(Math.min(150, type == 'embed' ? state.n_tokens : state.n_tokens*2))
    .map(i => ({i}))

  var pointSel = c.svg.appendMany('g', pointData)

  var textSel = pointSel.append('text').text(d => d.i % state.n_tokens)
    .at({textAnchor: 'middle', dy: '.33em', fontSize: 10})
    // .at({fill: d => d3.interpolateSinebow(d.i/state.n_tokens)})

  var abTextSel = c.svg.appendMany('text', ['a', 'b'])
    .at({textAnchor: 'middle', dy: '.33em', fontSize: 10})
    .text(d => isEmbed ? d : '')

  pointSel.append('circle').at({r: 3})

  var connectionPathSel = c.svg.append('path').at({stroke: '#000', strokeDasharray: '2 2'})
  var meanPathSel = c.svg.append('path').at({stroke: '#000'})
  var meanCircleSel = c.svg.append('circle').at({r: 4, fill: '#F1F3F4', stroke: '#000'})

  pointData.forEach(d => d.pos = state[type][d.i])
  state.renderAll.model.fns.push(() => {
    pointSel.translate(d => c.xy(d.pos))
    textSel.translate(d => [d.pos[0]*10, -d.pos[1]*10])
  })


  state.renderAll.input.fns.push(() => {
    var {aPos, bPos, meanPos} = state

    if (type == 'embed'){
      pointSel.st({opacity: d => d.i == state.a || d.i == state.b ? 1 : .2})
      connectionPathSel.at({d: 'M' + c.xy(aPos) + 'L' + c.xy(bPos)})
    } else{
      var target = _.minBy(pointData, d => dist(d.pos, meanPos)).i
      pointSel.st({opacity: .2})
      pointSel.selectAll('text').text(d => d.i == target || d.i % 2 == 1 ? d.i % state.n_tokens : '')
      pointSel.classed('active', d => d.i == target )
    }

    abTextSel
      .translate(d => c.xy(mul(state.embed[state[d]], 1.2)))


    meanCircleSel.translate(c.xy(meanPos))
    meanPathSel.at({d: 'M' + c.xy([0, 0]) + 'L' + c.xy(meanPos)})
  })


  function mul(v, mag){
    return v.map(d => d*mag)
  }

  function dist([x0, y0], [x1, y1]){
    var dx = x0 - x1
    var dy = y0 - y1
    return Math.sqrt(dx*dx + dy*dy)    
  }
}
window.initAppendix?.()
