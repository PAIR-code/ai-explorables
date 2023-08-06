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


window.initProjVis = async function({type, state, sel, title, caption}){
  var isIn = type == 'inProj'
  
  sel = sel.append('div')
  var c = d3.conventions({
    sel: sel.append('div'),
    width:  300,
    height: 300,
    layers: 's',
    margin: {top: 30, bottom: 0},
  })
  sel.append('p.caption').html(caption).st({width: 300})
  sel.select('.directions-caption').appendMany('span', state.neurons)
    .st({background: d => d.color, display: 'inline-block', width: 2, marginRight: 1}).html('&nbsp;')

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

  var pointData = d3.range(Math.min(state.n_tokens, 100))
    .map(i => ({i}))

  var lineSel = c.svg.appendMany('path', pointData)
    .st({opacity: isIn ? 0 : .2})

  
  if (!isIn){
    c.svg.appendMany('path', state.neurons)
      .at({stroke: d => d.color, strokeDasharray: d => d.isDash ? '2 1' : '', strokeWidth: 1})
      .at({d: d => 'M' + c.xy([0, 0]) + 'L' + c.xy(mul(d[type], .93))})
      .translate(d => {
          var v = state.n_neurons % 2 ? 0 : d.i <= 2 ? -1 : 1
          var [x, y] = d.outProj
          return [y*v, x*v]
        })
  }

  c.svg.appendMany('path', state.neurons)
    .at({stroke: d => isIn ? d.color : 'rgba(0,0,0,0)', strokeDasharray: d => d.isDash ? '2 1' : '', strokeWidth: 1})
    .at({d: d => 'M' + c.xy([0, 0]) + 'L' + c.xy(mul(d[type], .93))})
    .at({'marker-end': "url(#arrow-appendix)"})

  var projSel = c.svg.appendMany('path', state.neurons)
    .at({stroke: d => d.color, strokeDasharray: d => d.isDash ? '2 1' : '', strokeWidth: 4})

  var projCircleSel = c


  var pointSel = c.svg.appendMany('g', pointData)

  var textSel = pointSel.append('text').text(d => d.i % state.n_tokens)
    .at({textAnchor: 'middle', dy: '.33em', fontSize: 10})

  pointSel.append('circle').at({r: 3})



  var connectionPathSel = c.svg.append('path').at({stroke: '#000', strokeDasharray: '2 2'})
  var meanPathSel = c.svg.append('path').at({stroke: '#000'})
  var meanCircleSel = c.svg.append('circle').at({r: 4, fill: '#F1F3F4', stroke: '#000'})
  var correctCircleSel = c.svg.append('circle').at({r: 4, fill: '#F1F3F4', stroke: '#f0f'})
    .st({opacity: isIn ? 0 : 1})



  state.renderAll.model.fns.push(() => {
    pointData.forEach(d => d.pos = state['embed'][d.i])
    pointSel.translate(d => c.xy(d.pos))
    textSel.translate(d => [d.pos[0]*10, -d.pos[1]*10])

    lineSel.at({d: d => 'M' + c.xy([0, 0]) + 'L' + c.xy(d.pos), stroke: '#ccc'})
  })


  state.renderAll.input.fns.push(() => {
    var {aPos, bPos, meanPos} = state

    if (isIn){
      pointSel.st({opacity: d => d.i == state.a || d.i == state.b ? 1 : .2})
      connectionPathSel.at({d: 'M' + c.xy(aPos) + 'L' + c.xy(bPos)})
    } else{
      pointSel.st({opacity: .2})
      pointSel.classed('active', d => d.i == state.correct )

      meanPathSel.st({display: 'none'})
      meanCircleSel.st({display: 'none'})
    }
    lineSel.st({stroke: d => d.i == state.correct ? '#f0f' : 'rgba(0,0,0,0)'})

    meanCircleSel.translate(c.xy(meanPos))
    meanPathSel.at({d: 'M' + c.xy([0, 0]) + 'L' + c.xy(meanPos)})

    projSel.at({
      d: d => 'M' + c.xy([0, 0]) + 'L' + c.xy(mul(d[type], d.val))
    })

    correctCircleSel.translate(c.xy(sum(state.neurons.map(d => d.outPos))))
  })

  function mul(v, mag){
    return v.map(d => d*mag)
  }

  function sum(v){
    var a = d3.sum(v, d => d[0])
    var b = d3.sum(v, d => d[1])
    return [a, b]
  }


}
window.initAppendix?.()
