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


window.initCircleInputVis = async function({type, state}){

  var isSingle = type == 'outW-embed'
  var ogType = type

  if (type.includes('outW')) type = 'outW'
  var isOut = type == 'outW'

  var isOutEmbed = ogType == 'outW-embed'


  d3.select('.circle-input-' + ogType).html('')
    .appendMany('div', d3.range(isSingle ? 1 : state.hidden_size))
    .st({display: 'inline-block', zIndex: d => d ? 0 : 100, })
    .each(initCircle)

  function initCircle(hiddenIndex){
    var c = d3.conventions({
      sel: d3.select(this),
      width:  160,
      height: 160,
    })

    c.yAxis.ticks(3)
    c.xAxis.ticks(3)

    c.svg.append('text').text(type.replace('hidden', 'input') + ' ' + hiddenIndex)
      .at({y: -5, fontSize: 12})

    var valTextSel = c.svg.append('text')
      .at({y: -2, fontSize: 12, x: c.width, textAnchor: 'end'})


    var lineSel = c.svg.append('path').at({stroke: '#000'})
    var lineNegSel = c.svg.append('path').at({stroke: '#000', strokeDasharray: '2 2'})

    var thickLineSel = c.svg.append('path').at({stroke: '#64FFDA', opacity: 1, strokeWidth: 5})
    var circleSel = c.svg.appendMany('circle', isOutEmbed ? d3.range(state.hidden_size) : [hiddenIndex])
      .at({r: 7, fill: '#64FFDA', stroke: '#03c697', strokeWidth: 2})

    var circleNumSel = c.svg.appendMany('text', isOutEmbed ? d3.range(state.hidden_size) : [hiddenIndex])
      .text(d => d)
      .at({textAnchor: 'middle', dy: '.33em', fontSize: 12})
      .style('text-shadow', '0 1px 0 #64FFDA, 1px 0 0 #64FFDA, 0 -1px 0 #64FFDA, -1px 0 0 #64FFDA')

    state.renderAll.model.fns.push(render)

    var centerSel = c.svg.append('g')
      .translate([c.width/2, c.height/2])

    var aLineSel = centerSel.append('path').at({strokeWidth: 2, opacity: 1, stroke: util.colors.aInput, fill: 'none'})
    var bLineSel = centerSel.append('path').at({strokeWidth: 2, opacity: 1, stroke: util.colors.bInput, fill: 'none'})

    var aPoints = d3.range(0, 1 + .001, .001).map(v => ({v, x: 0, y: 0}))
    var bPoints = d3.range(0, 1 + .001, .001).map(v => ({v, x: 0, y: 0}))

    var aCircleSel = c.svg.append('circle').at({r: 5, stroke: util.colors.aInput, fill: 'none', strokeWidth: 3})
    var bCircleSel = c.svg.append('circle').at({r: 5, stroke: util.colors.bInput, fill: 'none', strokeWidth: 3})

    // var aProjSel = centerSel.append('path').at({strokeWidth: 2, opacity: 1, stroke: util.colors.aInput, fill: 'none'})
    // var bProjSel = centerSel.append('path').at({strokeWidth: 2, opacity: 1, stroke: util.colors.bInput, fill: 'none'})

    var line = d3.line().x(d => d.x).y(d => d.y)
      .curve(d3.curveCatmullRomOpen)


    var connectPathSel = c.svg.appendMany('path', d3.range(state.hidden_size))

    
    state.renderAll.input.fns.push(() => {
      var {a, b, n_tokens} = state
      var r = c.r

      var ωk = Math.PI*2*1/n_tokens

      function calcPos(x, dr){
        var spiralSpacing = .5 
        var rs = spiralSpacing * x * Math.sqrt(ωk) + r
        var rs = r + dr

        return [Math.cos(ωk*x)*rs, - Math.sin(ωk*x)*rs]
      }

      aPoints.forEach(d => { 
        var [x, y] = calcPos(d.v*a, -1) 
        d.x = x 
        d.y = y 
      }) 
      bPoints.forEach(d => { 
        var [x, y] = calcPos((isOut ? a : 0) + d.v*b, 1)
        d.x = x
        d.y = y
      }) 

      aLineSel.at({d: line(aPoints)})
      bLineSel.at({d: line(bPoints)})

      var pos = state.model[type][hiddenIndex]
      function calcDot(num){
        var x = [
          Math.cos(2*Math.PI*num/n_tokens),
          Math.sin(2*Math.PI*num/n_tokens),
        ]

        var y = state.model['hiddenWT'][hiddenIndex]

        return x[0]*y[0] + x[1]*y[1]
      }

      var aDot = calcDot(a)
      aCircleSel.translate([c.x(pos[0]*aDot), c.y(pos[1]*aDot)])

      var bDot = calcDot(b)
      bCircleSel.translate([c.x(pos[0]*bDot), c.y(pos[1]*bDot)])

      var hiddenVal = Math.max(0, aDot + bDot)

      if (ogType == 'outW'){
        aCircleSel.st({opacity: 0})
        bCircleSel.st({opacity: 0})

        var targetPos = [c.x(pos[0]*hiddenVal), c.y(pos[1]*hiddenVal)]
        targetPos.hiddenVal = hiddenVal
        circleSel.translate(targetPos)
        circleNumSel.translate(targetPos).st({opacity: hiddenVal > 0 ? 1 : 0})
        state.temp_out_w[hiddenIndex] = targetPos

        thickLineSel.at({
          d: ['M', c.x(0), c.y(0), 'L', targetPos].join(' ')
        })

        lineNegSel.st({opacity: 0})
        centerSel.st({opacity: 0})
      } else if (ogType == 'hiddenWT') {
        valTextSel.text('val: ' + d3.format('.2f')(hiddenVal))
        circleSel.at({r: 0})
        circleNumSel.st({opacity: 0})
      } else{
        lineSel.st({opacity: 0})
        lineNegSel.st({opacity: 0})
        aCircleSel.st({opacity: 0})
        bCircleSel.st({opacity: 0})

        circleSel.translate(i => state.temp_out_w[i])
        circleNumSel.translate(i => state.temp_out_w[i])
          .st({opacity: i => state.temp_out_w[i].hiddenVal > 0 ? 1 : 0})

        var mean = [d3.mean(state.temp_out_w, d => d[0]), d3.mean(state.temp_out_w, d => d[1])]
        var sum = [
          d3.sum(state.temp_out_w, d => d[0] - c.x(0)) + c.x(0), 
          d3.sum(state.temp_out_w, d => d[1] - c.y(0)) + c.y(0)
        ]
        connectPathSel.at({
          d: i => `M ${sum} L ${state.temp_out_w[i]}`,
          stroke: '#000',
        })
      }
    })


    function render(){
      var allWs = state.model.hiddenWT.concat(state.model.outW).flat()
      var max = d3.max(allWs.map(Math.abs))

      c.svg.selectAll('rect, .axis').remove()
      c.x.domain([-max*1.3, max*1.3])
      c.y.domain([-max*1.3, max*1.3])
      d3.drawAxis(c)
      util.ggPlot(c)

      c.r = c.x(max*.7)/(isOut ? 2 : 2)

      c.svg.append('circle')
        .translate([c.width/2, c.height/2]).at({r: c.r, stroke: '#ccc', fill: 'none'})

      connectPathSel.raise()
      centerSel.raise()
      thickLineSel.raise()


      var pos = state.model[type][hiddenIndex]
      lineSel.raise().at({
        d: ['M', c.x(0), c.y(0), 'L', c.x(pos[0]), c.y(pos[1])].join(' ')
      })
      lineNegSel.raise().at({
        d: ['M', c.x(0), c.y(0), 'L', c.x(-pos[0]), c.y(-pos[1])].join(' ')
      })
      circleSel.raise().translate([c.x(pos[0]), c.y(pos[1])])

      aCircleSel.raise()
      bCircleSel.raise()
      circleNumSel.raise()

    }

  }

}

window.initHandWeights?.()
