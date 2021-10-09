/* Copyright 2021 Google LLC. All Rights Reserved.

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

window.initPair = function(pair, sel){

  var margin = {bottom: 50, left: 30, top: 20, right: 20}
  var totalWidth = sel.node().offsetWidth
  var width = totalWidth - margin.left - margin.right

  var c = d3.conventions({
    sel: sel.append('div'),
    width,
    height: width,
    layers: 'scs',
    margin,
  })

  var nTicks = 4
  var tickScale = d3.scaleLinear().range([0, c.width])
  c.svg.appendMany('path.bg-tick', d3.range(nTicks + 1))
    .at({d: d => `M ${.5 + Math.round(tickScale(d/nTicks))} 0 V ${c.height}`})
  c.svg.appendMany('path.bg-tick', d3.range(nTicks + 1))
    .at({d: d => `M 0 ${.5 + Math.round(tickScale(d/nTicks))} H ${c.width}`})


  var scatter = window.initScatter(c)

  var allTokens = pair.e0.map((v0, i) => {
    return {word: pair.vocab[i], v0, i, v1: pair.e1[i]}
  })
  allTokens.forEach(d => {
    d.dif = d.v0 - d.v1
    d.meanV = (d.v0 + d.v1) / 2
    d.isVisible = false
  })

  _.sortBy(allTokens, d => -d.v1).forEach((d, i) => d.v1i = i)
  _.sortBy(allTokens, d => -d.v0).forEach((d, i) => d.v0i = i)

  var topTokens = allTokens.filter(d => d.v0i <= pair.count || d.v1i <= pair.count)


  var logitExtent = d3.extent(topTokens.map(d => d.v0).concat(topTokens.map(d => d.v1)))

  var tokens = allTokens
    .filter(d => logitExtent[0] <= d.v0 && logitExtent[0] <= d.v1)

  var mag = logitExtent[1] - logitExtent[0]
  logitExtent = [logitExtent[0] - mag*.002, logitExtent[1] + mag*.002]

  if (pair.isDifference) tokens = _.sortBy(allTokens, d => -d.meanV).slice(0, pair.count)

  tokens.forEach(d => {
    d.isVisible = true
  })

  var maxDif = d3.max(d3.extent(tokens, d => d.dif).map(Math.abs))
  var color = util.palette(-maxDif*.8, maxDif*.8)

  if (pair.isDifference){
    drawRotated()
  } else{
    drawXY()
  }

  function drawXY(){
    c.x.domain(logitExtent)
    c.y.domain(logitExtent)

    d3.drawAxis(c)

    var s = 2
    var scatterData = allTokens.map(d => {
      var x = c.x(d.v0)
      var y = c.y(d.v1)
      var fill = color(d.dif)
      var dif = d.dif
      var word = d.word
      var show = ''
      var isVisible = d.isVisible

      return {x, y, s, dif, fill, word, show, isVisible}
    })

    c.svg.append('path').at({d: `M 0 ${c.height} L ${c.width} 0`, stroke: '#ccc'})

    var textCandidates = _.sortBy(scatterData.filter(d => d.isVisible), d => d.dif)
    d3.nestBy(textCandidates.slice(0, 1000), d => Math.round(d.y/10))
      .forEach(d => d[0].show = 'uf')
    d3.nestBy(textCandidates.reverse().slice(0, 1000), d => Math.round(d.y/10))
      .forEach(d => d[0].show = 'lr')

    logitExtent.pair = pair
    scatter.draw(c, scatterData)

    c.svg.selectAppend('text.x-axis-label.xy-only')
      .translate([c.width/2, c.height + 24])
      .text(pair.label0 + (pair.label0.includes(' dif') ? '' : ' →'))
      .st({fill: util.colors[0]})
      .at({textAnchor: 'middle'})

    c.svg.selectAppend('g.y-axis-label.xy-only')
      .translate([c.width + 20, c.height/2])
      .selectAppend('text')
      .text(pair.label1 + (pair.label0.includes(' dif') ? '' : ' →'))
      .st({fill: util.colors[1]})
      .at({textAnchor: 'middle', transform: 'rotate(-90)'})

    if (pair.topLabel){
      console.log(pair.topLabel)
      c.svg.selectAppend('text.x-axis-label.top')
        .translate([c.width/2, -10])
        .text(pair.topLabel)
        .st({fill: '#000'})
        // .st({fill: util.colors[0]})
        .at({textAnchor: 'middle'})
    }
  }

  function drawRotated(){
    c.x.domain(d3.extent(tokens, d => d.meanV))
    c.y.domain([maxDif, -maxDif])

    d3.drawAxis(c)

    var scatterData = allTokens.map(d => {
      var x = c.x(d.meanV)
      var y = c.y(d.dif)
      var fill = color(d.dif)
      var word = d.word
      var show = ''
      var isVisible = d.isVisible

      return {x, y, s: 2, fill, word, show, isVisible}
    })

    scatterData.forEach(d => {
      d.dx = d.x - c.width/2
      d.dy = d.y - c.height/2
    })

    var textCandidates = _.sortBy(scatterData, d => -d.dx*d.dx - d.dy*d.dy)
      .filter(d => d.isVisible)
      .slice(0, 5000)
    d3.nestBy(textCandidates, d => Math.round(12*Math.atan2(d.dx, d.dy)))
      .map(d => d[0])
      .forEach(d => d.show = (d.dy < 0 ? 'u' : 'l') + (d.dx < 0 ? 'l' : 'r'))

    scatter.draw(c, scatterData, false)

    c.svg.selectAppend('text.rotate-only.x-axis-label')
      .translate([c.width/2, c.height + 24])
      .text('__ likelihood, both sentences →')
      .at({textAnchor: 'middle'})
      .st({fill: '#000'})

    c.svg.selectAll('g.rotate-only.sent-1,g.rotate-only.sent-1').remove()
    c.svg.selectAppend('g.rotate-only.sent-1')
      .translate([c.width + 20, c.height/2])
      .append('text')
      .text(`Higher likelihood, ${pair.label1 ? pair.label1 + ' sentence ' : 'sentence one'}  →`)
      .at({textAnchor: 'start', transform: 'rotate(-90)', x: 20})
      .st({fill: util.colors[1]})

    c.svg.selectAppend('g.rotate-only.sent-1')
      .translate([c.width + 20, c.height/2 + 0])
      .append('text')
      .text(`← Higher likelihood, ${pair.label0 ? pair.label0 + ' sentence ' : 'sentence two'}`)
      .at({textAnchor: 'end', transform: 'rotate(-90)', x: -20})
      .st({fill: util.colors[0]})
  }
}

if (window.init) init()
