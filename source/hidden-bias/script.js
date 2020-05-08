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


var ttSel = d3.select('body').selectAppend('div.tooltip.tooltip-hidden')

var colors = {
  m: '#7DDAD3',
  f: '#9B86EF',
  h: '#F0BD80',
  l: '#FF777B',
  grey: '#ccc',
}


var totalWidth = width = d3.select('#graph').node().offsetWidth
var r = 40

var sel = d3.select('#graph').html('')
  .append('div')

var extraWidth = d3.clamp(500, innerHeight - 150, innerWidth - 500)
var scale = extraWidth/500
scale = 1
sel.st({transform: `scale(${scale})`, transformOrigin: '0% 0%'})

var c = d3.conventions({
  sel,
  totalWidth,
  totalHeight: totalWidth,
  margin: {left: 25, right: 7},
  layers: 'sd',
})
var divSel = c.layers[1]

c.x.domain([1, 4]).clamp(true).interpolate(d3.interpolateRound)
c.y.domain([1, 4]).clamp(true).interpolate(d3.interpolateRound)

c.xAxis.ticks(3).tickFormat(d3.format('.1f'))
c.yAxis.ticks(3).tickFormat(d3.format('.1f'))
d3.drawAxis(c)

var axis2Sel= c.svg.append('g.axis').append('line')
  .translate(Math.round(c.y(2)) + .5, 1)
  .at({x2: c.width, stroke: '#000', opacity: 0})

var meanGPADiff = .6

var seed = new Math.seedrandom('hii')
var students = d3.range(150).map((d, index) => {
  var collegeGPA = d3.randomUniform.source(seed)(1, 4)()

  // if (index == 93) collegeGPA = 2.05
  // if (index == 87) collegeGPA = 2.15
  // if (index == 32) collegeGPA = 2.25
  if (index == 131) collegeGPA = 3.9

  // var hsGPA = collegeGPA*d3.randomNormal(1, .4)()
  var hsGPA = collegeGPA + d3.randomNormal.source(seed)(meanGPADiff, .8)()
  var hsGPAadjusted = hsGPA - meanGPADiff

  var rand = d3.randomUniform.source(seed)(0, 1)

  var isMale = rand() < .5
  var name = names[isMale ? 'm' : 'f'][Math.floor(d/2)]
  var lastName = names.last[d]
  var maleOffset = rand()*(isMale ? 1 : -1)*.6

  // if (index == 47) name = 'Mia'
  // if (index == 82) name = 'Mason'


  var compGPA0 = lerp(hsGPAadjusted, collegeGPA, rand()*.7) + maleOffset
  var compGPA1 = lerp(compGPA0, collegeGPA + maleOffset, rand()*1.1)
  var compGPA2 = compGPA1 + rand()/4 - 1/4/2
  // var compGPA0 = collegeGPA + d3.randomNormal.source(seed)(0, .5)()
  // var compGPA1 = collegeGPA + d3.randomNormal.source(seed)(0, .3)()

  if (index == 69){
    compGPA1 = 2.0
  }
  if (index == 37){
    compGPA1 = 2.0
  }


  var isLowIncome = rand() < .5

  var inteviewGPA = collegeGPA + d3.randomNormal.source(seed)(0, .15)() 
  var inteviewGPAbias = inteviewGPA + rand()*(isLowIncome ? -1 : 1)*.5

  // if (index == 115) name = 'Mason'
  // if (index == 32) name = 'Mia'

  if (name == 'Camila') name = 'Mia'


  return {name, index, lastName, collegeGPA, hsGPA, hsGPAadjusted, compGPA0, compGPA1, compGPA2, isMale, isLowIncome, inteviewGPA, inteviewGPAbias}
})

students = _.sortBy(students, d => d.collegeGPA)

students = students.filter(d => {
  return d3.entries(d).every(({key, value}) => {
    if (!key.includes('GPA')) return true

    return 1 < value && value < 4.0
  })
})


c.svg.append('path')
  .at({
    d: ['M', 0, c.height, 'L', c.width, 0].join(' '),
    stroke: '#ccc',
    strokeWidth: 2,
    strokeDasharray: '4 2'
  })

!(function(){
  // return window.annotationSel = d3.select(null)
  var isDrag = 0
  if (!isDrag) annotations.forEach(d => d.text = d.html ? '' : d.text)
  if (isDrag){
    d3.select('#sections').st({pointerEvents: 'none'})
  }

  // copy('window.annotations = ' + JSON.stringify(annotations, null, 2))
  var swoopy = d3.swoopyDrag()
    .x(d => c.x(d.x))
    .y(d => c.y(d.y))
    .draggable(isDrag)
    .annotations(annotations)
    .on('drag', d => {

    })


  var htmlAnnoSel = divSel.appendMany('div.annotation', annotations.filter(d => d.html))
    .translate(d => [c.x(d.x), c.y(d.y)]).st({position: 'absolute', opacity: 0})
    .append('div')
    .translate(d => d.textOffset)
    .html(d => d.html)
    .st({width: 150})



  var swoopySel = c.svg.append('g.annotations').call(swoopy)

  c.svg.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '-10 -10 20 20')
      .attr('markerWidth', 20)
      .attr('markerHeight', 20)
      .attr('orient', 'auto')
    .append('path')
      .attr('d', 'M-6.75,-6.75 L 0,0 L -6.75,6.75')

  swoopySel.selectAll('path')
    .attr('marker-end', 'url(#arrow)')
    .st({'opacity': d => d.path == 'M 0 0' ? 0 : 1})
  window.annotationSel = swoopySel.selectAll('g')
    .st({fontSize: 12, opacity: d => d.slide == 0 ? 1 : 0})

  window.annotationSel = d3.selectAll('g.annotations g, div.annotation')

  swoopySel.selectAll('text')
    .each(function(d){
      d3.select(this)
        .text('')                        //clear existing text
        .tspans(d3.wordwrap(d.text, d.width || 20), 13) //wrap after 20 char
    })  
  })()



students = _.sortBy(students, d => d.collegeGPA)
var lineSel = c.svg.appendMany('path', students)
  .translate(d => [c.x(d.hsGPA), c.y(d.collegeGPA)])
  .at({
    // fill: d => d.hsGPA > d.collegeGPA ? 'blue' : 'orange',
    fill: '#eee',
    stroke: '#aaa',
    strokeWidth: .5,
    opacity: 0,
    // strokeWidth: 1/scale,
  })


var circleSel = c.svg.appendMany('g', students)
  .translate(d => [c.x(d.collegeGPA), c.y(d.hsGPA)])
  .call(d3.attachTooltip)
  .on('mouseover', d => {
    var html = ''
    html += `<div><b>${d.name} ${d.lastName}</b></div>`

    if (curSlide.circleFill == 'gender'){
      html += `<span style='background: ${colors[d.isMale ? 'm' : 'f']}'>${d.isMale ? 'Male' : 'Female'}</span>`
    }

    if (curSlide.circleFill == 'income'){
      html += `<span style='background: ${colors[d.isLowIncome ? 'l' : 'h']}'>${d.isLowIncome ? 'Low Income' : 'High Income'}</span>`
    }
    html += `
      <div><b>${d3.format('.2f')(d[curSlide.yKey]).slice(0, 4)}</b> ${curSlide.index ? 'Predicted' : 'High School'} GPA</div>
      <div><b>${d3.format('.2f')(d.collegeGPA).slice(0, 4)}</b> College GPA</div>`

    ttSel.html(html)
  })


var innerCircleSel = circleSel.append('circle')
  .at({
    r: 5,
    fill: '#eee',
    stroke: '#aaa'
  })

// var textSel = circleSel.append('text').text(d => d.isMale ? 'M' : 'F')
//   .at({textAnchor: 'middle', dy: '.33em', fontSize: 8, fill: '#eee'})
// var textSel2 = circleSel.append('text').text(d => d.isLowIncome ? 'L' : 'H')
//   .at({textAnchor: 'middle', dy: '.33em', fontSize: 8, opacity: 0})


c.svg.select('.y').selectAll('line').filter(d => d == 4)
  .remove()
c.svg.select('.y').selectAll('text').filter(d => d == 4)
  .select(function() {
    return this.parentNode.insertBefore(this.cloneNode(1), this.nextSibling);
  })
  .text('Actual College GPA')
  .at({x: c.width/2, y: c.height + 35, textAnchor: 'middle', fontWeight: 800})

var yLabelSel = divSel.st({pointerEvents: 'none'}).append('div.axis')
  .html('<b>High School GPA</b>')
  .translate([0, -9])
  .st({textAlign: 'left', maxWidth: 260})

// c.svg.append('text').text('Actual College GPA').st({fontWeight: 800})

var longLabel = 'high school GPA, essay, clubs, zip code, teacher recommendations, sports, AP scores, demonstrated interest, gender, SAT scores, interviews, portfolio, race, work experience'

var slides = [
  {
    yKey: 'hsGPA',
    isLineVisible: 0,
    yLabel: '<b>High School GPA</b>',
    circleFill: 'grey',
    circleFillDelay: d => 0,
  },

  {
    yKey: 'hsGPA',
    isLineVisible: true,
    yLabel: '<b>High School GPA</b>'
  },

  {
    yKey: 'hsGPAadjusted',
    yLabel: 'high school GPA'
  },

  {
    yKey: 'compGPA0',
    yLabel: 'high school GPA, essay, clubs, zip code'.replace('essay', '<span class="highlight blue">essay') + '</span>'
  },

  {
    yKey: 'compGPA1',
    yLabel: longLabel.replace('teacher', '<span class="highlight blue">teacher') + '</span>',
    circleFill: 'grey',
    circleFillDelay: d => 0,
    textFill: '#eee',
  },

  {
    yKey: 'compGPA1',
    yLabel: longLabel,
    circleFill: 'gender',
    circleFillDelay: (d, i) => i*20 + (d.isMale ? 0 : 2000),
    textFill: '#000',
  },

  {
    name: 'proxyHighlight',
    yKey: 'compGPA2',
    yLabel: longLabel,
    circleFill: 'gender',
    circleFillDelay: d => 0,
    textFill: '#000',
  },

  {
    textFill: '#eee',
    yLabel: 'Alumni interview',
    yKey: 'inteviewGPAbias',
    circleFill: 'grey',
    text2Opacity: 0,
  },

  {
    textFill: '#eee',
    yLabel: 'Alumni interview',
    yKey: 'inteviewGPAbias',
    circleFill: 'income',
    circleFillDelay: (d, i) => i*20 + (!d.isLowIncome ? 2000 : 0),
    text2Opacity: 1,
  },

  {
    textFill: '#eee',
    yLabel: 'Alumni interview, household income'.replace('household', '<span class="highlight blue">household') + '</span>',
    yKey: 'inteviewGPA',
    text2Opacity: 1,
  },
]

slides.forEach(d => {
  if (d.name == 'proxyHighlight'){
    var proxies = 'clubs, interviews, portfolio, sports'.split(', ')
    d.yLabel = d.yLabel
      .split(', ')
      .map(d => {
        if (d == 'gender') return `<span class='strikethrough'>gender</span>`
        if (!proxies.includes(d)) return d

        return `<span class='highlight yellow'>${d}</span>`
      })
      .join(', ')
  }


  if (d.yLabel[0] != '<') d.yLabel = '<b>Predicted College GPA</b> using ' + d.yLabel.replace('School', 'school')
})

var keys = []
slides.forEach(d => keys = keys.concat(d3.keys(d)))
_.uniq(keys).forEach(str => {
  var prev = null
  slides.forEach(d => {
    if (typeof(d[str]) === 'undefined'){
      d[str] = prev
    }
    prev = d[str]
  }) 
})

slides.forEach((d, i) => {
  d.circleFillFn = {
    grey: d => '#eee',
    gender: d => d.isMale ? colors.m : colors.f,
    income: d => d.isLowIncome ? colors.l : colors.h,
  }[d.circleFill]

  d.index = i
})




var gs = d3.graphScroll()
  .container(d3.select('.container-1'))
  .graph(d3.selectAll('container-1 #graph'))
  .eventId('uniqueId1')
  .sections(d3.selectAll('.container-1 #sections > div'))
  .offset(innerWidth < 900 ? 300 : 520)
  .on('active', updateSlide)


var prevSlide = -1
function updateSlide(i){
  var slide = slides[i]
  if (!slide) return
  curSlide = slide
  var {yKey} = slide

  lineSel.transition('yKey').duration(500)
    .at({
      d: d => [
        'M 5 0', 
        'C 0 0',  
        0, c.y(d['collegeGPA']) - c.y(d[yKey]),
        0, c.y(d['collegeGPA']) - c.y(d[yKey]),
        'S 0 0 -5.5 0'
      ].join(' ')
    })
    .translate(d => [c.x(d.collegeGPA), c.y(d[yKey])])


  circleSel.transition('yKey').duration(500)      
    .translate(d => [c.x(d.collegeGPA), c.y(d[yKey])])

  innerCircleSel.transition('colorFill').duration(30)
    .delay(slide.circleFillDelay)
    .at({
      fill: slide.circleFillFn, 
      stroke: d => d3.color(slide.circleFillFn(d)).darker(1.5)
    })

  axis2Sel.transition()
    .st({opacity: i == 5 ? 1 : 0})

  lineSel.transition('opacity').duration(500)
    .st({
      opacity: slide.isLineVisible ? 1 : 0
    })

  if (slide.yLabel) yLabelSel.html(slide.yLabel)


  annotationSel.transition()
    .st({opacity: d => i == d.slide ? 1 : 0})



  prevSlide = i
}

slide = slides[0]




d3.selectAll('.circle').each(function(){
  var d = d3.select(this).attr('class').split(' ')[0]

  d3.select(this)
    .st({
      backgroundColor: d3.color(colors[d]),
      borderColor: d3.color(colors[d]).darker(1.5),
    })

  
})




function lerp(a, b, t){ return a + t*(b - a) }



c.svg.selectAll('g.annotations').raise()



d3.selectAll('#sections img').attr('aria-hidden', true)








