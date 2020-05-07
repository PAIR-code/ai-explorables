/* Copyright 2020 Google LLC. All Rights Reserved.

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





console.clear()
var ttSel = d3.select('body').selectAppend('div.tooltip.tooltip-hidden')

window.renderFns = []

window.m = (function(){
  var rv = {b: .7, tpr: .8, fnr: .5, update, str: 'kids', titleStr: 'Children',}

  function update(obj={}){
    Object.assign(rv, obj)
    window.renderFns.forEach(d => d())
  }

  return rv
})()

window.f = (function(){
  var rv = {b: .3, tpr: .8, fnr: .5, update, str: 'adults', titleStr: 'Adults'}

  function update(obj={}){
    window.renderFns.forEach(d => d())
  }

  return rv
})()


var wLarge = d3.clamp(0, innerWidth/2 - 30, 300)

d3.select('#big-matrix').html('')
  .appendMany('div.big-container', [{w: wLarge, s: f, isText: 1}, {w: wLarge, s: m, isText: 1}])
  .each(drawMatrix)


addPattern(10, `pattern-${wLarge}-`)
addPattern(5, 'pattern-50-')

function addPattern(s, str){
  var cColors = [colors.sick, colors.sick, colors.well, colors.well, lcolors.sick, lcolors.sick, lcolors.well, lcolors.well]
  var rColors = [lcolors.sick, lcolors.well, lcolors.sick, lcolors.well, llcolors.sick, llcolors.well, llcolors.sick, llcolors.well]

  d3.select('#big-matrix')
    .append('svg')
    .st({height: 0, position: 'absolute'})
    .append('defs').appendMany('pattern', d3.range(8))
    .at({ id: i => str + i, width: s, height: s})
    .attr('patternUnits', 'userSpaceOnUse')
    .append('rect')
    .at({width: s, height: s, fill: i => rColors[i]})
    .parent().append('circle')
    .at({r: s == 10 ? 2.5 : 1.5, cx: s/2, cy: s/2, fill: i => cColors[i]})
}


var scale = d3.clamp(0, ((innerWidth - 50) / 3)/280, 1)
var isScaled = scale != 1

d3.select('#metrics').html('').st({height: 350*scale + 30})
  .appendMany('div', [0, 1, 2])
  .st({width: 280*scale, display: 'inline-block'})
  .append('div')
  .st({transform: `scale(${scale})`, transformOrigin: '0% 0%'})
  .append('div.metrics-container').st({width: 280})
  .each(drawMetric)

d3.selectAll('rect.drag')
  .on('mouseover.style', d => d3.selectAll('rect.' + d).st({strokeWidth: 3, stroke: '#000'}))
  .on('mouseout.style', d => d3.selectAll('rect.' + d).st({strokeWidth: 0}))

function drawMetric(i){
  var sel = d3.select(this)

  var text = [
    // 'Percentage of <span style="background: #fcf">sick people</span><br> who <span style="background: #f0f">test positive<span>',
    'Percentage of sick people<br> who test positive',
    'Percentage of positive tests<br> who are actually sick',
    'Percentage of well people <br>who test negative',
  ][i]

  var percentFn = [
    s => s.tpr,
    s => s.b*s.tpr/(s.b*s.tpr + (1 - s.b)*(s.fnr)),
    s => 1 - s.fnr,
  ][i]

  var colors = [
    ['#f0f', '#fcf', '#fff', '#fff'],
    ['#f0f', '#fff', '#fcf', '#fff'],
    ['#fff', '#fff', '#fcf', '#f0f'],
  ][i]

  sel.append('h3').st({marginBottom: 20, fontSize: isScaled ? 30 : 20}).html(isScaled ? text.replace('<br>', '') : text)

  var h = 200
  var width = 100

  var fDiv = sel.append('div').st({position: 'relative', top: -h + 7})
    .datum({w: 50, s: f, isText: 0, colors}).each(drawMatrix)

  var svg = sel.append('svg')
    .at({width, height: h})
    .st({fontSize: 14, fontFamily: 'monospace'})

  svg.append('path').at({stroke: '#ccc', d: `M ${width/2 + .5} 0 V ${h}`})

  var errorSel = svg.append('path')
    .translate(width/2 + .5, 0)
    .at({stroke: 'orange', strokeWidth: 3})

  var fSel = svg.append('g')
  var mSel = svg.append('g')

  mSel.append('circle').at({r: 4, cx: width/2 + .5, fill: 'none', stroke: '#000'})
  fSel.append('circle').at({r: 4, cx: width/2 + .5, fill: 'none', stroke: '#000'})

  var fTextSel = fSel.append('text').text('23%')
    .at({dy: '.33em', textAnchor: 'middle', x: width/4 - 3, fontSize: isScaled ? 20 : 16})
  var mTextSel = mSel.append('text').text('23%')
    .at({dy: '.33em', textAnchor: 'middle', x: width/4*3 + 5, fontSize: isScaled ? 20 : 16})

  fSel.append('text').text('Adults').st({fontSize: isScaled ? 18 : 12})
    .at({textAnchor: 'middle', x: -23, y: -30})
  mSel.append('text').text('Children').st({fontSize: isScaled ? 18 : 12})
    .at({textAnchor: 'middle', x: 124, y: -30})

  var mDiv = sel.append('div').st({position: 'relative', top: -h + 7})
    .datum({w: 50, s: m, isText: 0, colors}).each(drawMatrix)


  renderFns.push(() => {
    var fPercent = percentFn(f)
    fSel.translate(h - h*fPercent, 1)
    fTextSel.text(d3.format('.0%')(fPercent))

    var mPercent = percentFn(m)
    mSel.translate(h - h*mPercent, 1)
    mTextSel.text(d3.format('.0%')(mPercent))

    fDiv.translate(h - h*fPercent, 1)
    mDiv.translate(h - h*mPercent, 1)

    errorSel.at({d: 'M 0 ' + (h - h*fPercent) + ' V ' + (h - h*mPercent) })
  })
}

function drawMatrix({s, w, isText, colors}){
  var svg = d3.select(this).append('svg')
    .at({width: w, height: w})
    

  svg.append('rect').at({width: w + 1, height: w + 1})

  if (!colors) colors = ['#000', '#000', '#000', '#000']

  var rects = [
    {n: 'tp', x: 0, y: 0, width: _ => s.b*w, height: _ => s.tpr*w},
    {n: 'fn', x: 0, y: _ => 1 + s.tpr*w, width: _ => s.b*w, height: _ => w - s.tpr*w},
    {n: 'fp', x: _ => 1 + s.b*w, y: 0, width: _ => w - s.b*w, height: _ => s.fnr*w},
    {n: 'tn', x: _ => 1 + s.b*w, y: _ => 1 + s.fnr*w, width: _ => w - s.b*w, height: _ => w - s.fnr*w},
  ]
  rects.forEach((d, i) => d.i = i)

  var rectSel = svg.appendMany('rect', rects)
    .at({fill: d =>  `url(#pattern-${w}-${d.i}`})
    // .at({opacity: d => colors[d.i] == '#fff' ? .5 : 1})
    // .at({fill: d =>  `url(#pattern-${w}-${d.i + (colors[d.i] == '#ccc' ? 4 : 0)})`})
    // .at({fill: d =>  colors[d.i] == '#ccc' ? '#000' : `url(#pattern-${w}-${d.i + (colors[d.i] == '#ccc' ? 4 : 0)})`})
    .each(function(d){ d.sel = d3.select(this) })
  rectSel.filter(d => colors[d.i] == '#fff').at({fill: '#eee'})

  var bh = .5
  svg.append('rect.tpr').at({height: bh}).translate(-bh/2, 1)
    .datum('tpr')

  svg.append('rect.fnr').at({height: bh}).translate(-bh/2, 1)
    .datum('fnr')

  svg.append('rect.b').at({width: bh, height: w}).translate(-bh/2, 0)
    .datum('b')

  var bh = 20
  svg.append('rect.drag.tpr').at({height: bh}).translate(-bh/2, 1)
    .call(makeDrag('tpr', 1)).datum('tpr').call(d3.attachTooltip).on('mouseover', ttFormat)

  svg.append('rect.drag.fnr').at({height: bh}).translate(-bh/2, 1)
    .call(makeDrag('fnr', 1)).datum('fnr').call(d3.attachTooltip).on('mouseover', ttFormat)

  svg.append('rect.drag.b').at({width: bh, height: w}).translate(-bh/2, 0)
    .call(makeDrag('b', 0)).datum('b').call(d3.attachTooltip).on('mouseover', ttFormat)


  var tprRect = svg.selectAll('rect.tpr')
  var fnrRect = svg.selectAll('rect.fnr')
  var bRect = svg.selectAll('rect.b')

  function ttFormat(str){
    var html = ''
    if (str == 'tpr') html = `${d3.format('.0%')(s.tpr)} of sick ${s.titleStr.toLowerCase()} test positive`
    if (str == 'fnr') html = `${d3.format('.0%')(s.fnr)} of well ${s.titleStr.toLowerCase()} test negative`
    if (str == 'b') html = `${d3.format('.0%')(s.b)} of ${s.titleStr.toLowerCase()} are sick`
    ttSel.html(html) 
  }

  function makeDrag(str, index){

    return d3.drag()
      .on('drag', function(){
        var percent = d3.mouse(this)[index]/w
        s[str] = d3.clamp(.15, percent, .85)

        window.basetimer.stop()
        s.update()

        ttMove()
        ttFormat(str)
      })
      .on('start', _ => svg.classed('dragging', 1))
      .on('end', _ => svg.classed('dragging', 0))
  }

  renderFns.push(() => {
    rectSel.each(d => d.sel.at(d))

    tprRect.at({width: w*s.b, y: w*s.tpr})
    fnrRect.at({x: w*s.b, width: w - w*s.b, y: w*s.fnr})
    bRect.at({x: w*s.b})

    // s => s.tpr,
    // s => s.b*s.tpr/(s.b*s.tpr + (1 - s.b)*(s.fnr)),
    // s => 1 - s.fnr,
    if (!isText) return
  })


  if (!isText) return

  svg.append('text').text(s.titleStr).at({textAnchor: 'middle', x: w/2, y: -8, fontSize: 20})

  if (innerWidth < 800) return
  // if (true)  

  svg.appendMany('text', d3.range(4)).each(function(i){
    var isSick = i < 2
    var isPos = i % 2

    var pad = 5
    d3.select(this)
      .translate([isSick ? pad : w - pad, isPos ? 13 : w - 23])
      .at({
        textAnchor: isSick ? 'start' : 'end',
        fill: '#000',
        fontSize: 12,
        fontFamily: 'monospace',
        pointerEvents: 'none',
      })
      .tspans([
        ' test : ' + (isPos ? 'sick' : 'well'), 
        'truth: ' +  (isSick ? 'sick' : 'well')])
  })
}


if (window.basetimer) window.basetimer.stop()
window.basetimer = d3.timer(t => {

  var val = t/1000 % (Math.PI*4)

  if (val < Math.PI*2){
    m.b = (Math.sin(val + Math.PI/2))/4 + .4
  } else if (Math.PI*3 < val && val < Math.PI*5 || true){
    f.tpr = (Math.sin(val + Math.PI/2))/4 + .4
  }
  m.update()
})





m.update()



function ttMove(d){
  if (!ttSel.size()) return;

  var e = d3.event.sourceEvent,
      x = e.clientX,
      y = e.clientY,
      bb = ttSel.node().getBoundingClientRect(),
      left = d3.clamp(20, (x-bb.width/2), window.innerWidth - bb.width - 20),
      top = innerHeight > y + 20 + bb.height ? y + 20 : y - bb.height - 20;

  ttSel
    .style('left', left +'px')
    .style('top', top + 'px');
}

