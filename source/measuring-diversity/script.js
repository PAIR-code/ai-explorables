// Seeded random number generator
window.random = new Math.seedrandom('aaaa')
window.randomIndex = new Math.seedrandom('7b')

window.numRows = 20
window.shapes = window.shapes || d3.range(21).map(i => randomShape(i, random))

window.random2 = new Math.seedrandom('7')
// window.columnShapes = window.columnShapes || d3.range(window.numRows).map(i => d3.range(10).map(i =>randomShape(i, random2)))
window.columnShapes = d3.range(window.numRows).map(i => d3.range(10).map(i =>randomShape(i, random2, true)))

console.log(window.random3)
function randomShape(i, random, colTargets){
  var color2fill = {
    green: '#5A9F8A',
    orange: '#DF831F',
    blue: '#80BAD4',
  }

  var randomItem = function(arr) {
    const index = Math.abs(random.int32()) % arr.length
    return arr[index]
  }

  var color = randomItem(d3.keys(color2fill))
  var size = randomItem(['small', 'large'])
  var shape = randomItem(['circle', 'square', 'triangle'])

  if (colTargets && (i == 4 || i == 5)){
    color = 'green'
  }
  if (colTargets && (i == 4 || i == 15)){
    size = 'small'
  }
  if (colTargets && (i == 3 || i == 5)){
    shape = 'triangle'
  }

  var displayIndex = randomIndex()

  return {
    i,
    displayIndex,
    color,
    fill: color2fill[color],
    dFill: d3.color(color2fill[color]).darker(1),
    size,
    sizeVal: size == 'large' ? 1 : .4,
    shape,
  }
}

var metrics = [
  {
    str: 'Greens',
    key: 'green',
    field: 'color',
    target: .3 
  },
  {
    str: 'Dot',
    key: 'triangle',
    field: 'shape',
    target: .35
  },
  {
    str: 'Smalls',
    key: 'small',
    field: 'size',
    target: .60
  },
]
window.metrics1 = metrics.map(d => ({...d}))
metrics1[2].target = .5
window.metrics2 = metrics1.map(d => ({...d}))
metrics2[0].target = 1

metrics.forEach(d => {
  d.scoreScale = d3.scaleLinear().domain([0, d.target, 1]).range([0, 1, 0])
})


var pctFmt = d3.format('.0%')
function addMetrics(metrics, {active, topSel, isSmall}){  
  var metricSel = topSel
    .st({textAlign: 'center'})
    .appendMany('div', metrics)
    .st({textAlign: 'center', width: 200, display: 'inline-block'})

  var width = 120

  var svg = metricSel.append('svg')
    .at({width: 120, height: 100})
    .append('g')
    .translate([.5, 40.5])

  if (isSmall){
    svg.translate((d, i) => [i ? -20.5 : 20.5, 40.5])
  }


  var xScale = d3.scaleLinear().rangeRound([0, width])

  var topText = svg.append('text')
    .at({y: -20, fontWeight: 500, textAnchor: 'middle', x: width/2})

  svg.append('path')
    .at({d: 'M 0 0 H ' + width, stroke: '#000'})

  var topTick = svg.append('path')
    .at({d: 'M 0 0 V -12.5', stroke: '#000', strokeWidth: 3})
  
  
  var actualSel = svg.append('g').st({fill: highlightColor})

  actualSel.append('path')
    .at({d: 'M 0 0 V 12.5', stroke: highlightColor, strokeWidth: 3})

  var actualPct = actualSel.append('text')
    .translate(30, 1).at({textAnchor: 'middle'}).st({fontWeight: 300})

  var actualScore = actualSel.append('text')
    .translate(50, 1).at({textAnchor: 'middle'}).st({fontWeight: 300})

  return () => {
    var pcts = metrics.map(d => active.percents[d.key] || 0)

    topText.text(d => (d.str + ' Target: ').replace('s ', ' ') + pctFmt(d.target))

    topTick.translate(d => xScale(d.target), 0)
    actualSel.translate((d, i) => xScale(pcts[i]), 0)

    actualPct.text((d, i) => 'Actual: ' + pctFmt(pcts[i]))
    actualScore.text((d, i) => 'Difference: ' + pctFmt(Math.abs(d.target - pcts[i])))
  }
}


function scoreActive(active){
  var numActive = d3.sum(active)
  return metrics.map(m => {
    var v = d3.sum(active, (d, i) => active[i] && shapes[i][m.field] == m.key)
    return Math.abs(m.target - v/numActive);
    // return m.scoreScale(v/numActive || 0)
  })
}

var measures = [
  {
    str: 'Utilitarian',
    display_text: 'Minimize Mean Difference',
    ranking_display_text: 'Mean Difference',
    fn: s => d3.mean(s)*100,
    ppFn: s => d3.format('.2%')(d3.mean(s)),
    format: s => 'mean(' + s.map(d => d + '%').join(', ') + ')'
  },
  {
    str: 'Egalitarian',
    display_text: 'Minimize Max Difference',
    ranking_display_text: 'Max Difference',
    fn: s => {
      var srt = _.sortBy(s).map(d => Math.round(d*100)).reverse()

      return srt[0]*100000000 + srt[1]*10000 + srt[2]
    },
    ppFn: s => {
      var srt = _.sortBy(s).map(d => Math.round(d*100)).reverse()

      return srt[0] + '%'
    },
    format: s => 'max(' + s.map(d => d + '%').join(', ') + ')'
  }
]
measures2 = measures.map(d => ({...d}))


var randomActive = d3.range(10000).map(d => {
  var active = shapes.map(d => random() < .3)

  if (d == 0) active = '111111111111101011100'.split('').map(d => +d)

  active.score = scoreActive(active)
  measures.forEach(d => {
    active[d.str] = d.fn(active.score)
  })

  return active
})

function addMetricBestButton(metricIndex, {active, sel, render}){
  var measureSel = sel
    .append('div').st({textAlign: 'center', marginTop: 20, marginBottom: -20})
    .append('div.measure').st({width: 200, lineHeight: '1.8em', display: 'inline-block'})
    .html('Show Best')
    .on('click', d => {

      // console.log(active)
      var pcts = metrics.map(d => active.percents[d.key] || 0)
      if (pcts[metricIndex] == metrics[metricIndex].target) return

      var nextActive = _.minBy(randomActive, a => a.score[metricIndex])
      active.forEach((d, i) => active[i] = nextActive[i])

      measureSel.classed('active', e => e == d)
      render()
    })  
}

function addMeasures(measures, {active, sel, render}){
  var measureSel = sel.selectAll('div.measure-container')

  measureSel
    .append('div.measure')
    .st({width: 200, lineHeight: '1.8em', display: 'inline-block', textAlign: 'center', })
    .html((d, i) => i ? 'Show the set where the highest difference is the smallest' : 'Show the set with <br>lowest mean difference')
    .html('Show Best')
    .on('click', d => {

      var nextActive = _.minBy(randomActive, a => a[d.str])
      active.forEach((d, i) => active[i] = nextActive[i])

      measureSel.classed('active', e => e == d)
      render()
    })  

    
}

function addTotalMetrics(metrics, measures, {active, sel, render}){
  var metricSel = sel.classed('bot', 1).st({textAlign: 'center'})
    .appendMany('div.measure-container', measures)
    .append('div', measures)
    .st({textAlign: 'center', display: 'inline-block'})


  var headlineSel = metricSel.append('div')
  var calcSel = metricSel.append('div')//.st({color: highlightColor})

  return () => {

    measures.forEach(d => {
      d.scores = scoreActive(active)

      d.score = Math.round(d.fn(d.scores)*100)/100
      if (d.ppFn) d.score = d.ppFn(d.scores)
    })

    headlineSel.st({fontWeight: 600})
      .text(d => d.ranking_display_text + ': ' + d.score)

    calcSel.text(d => {
      var roundedScores = d.scores.map(s => Math.round(s * 100))

      return d.format(roundedScores)
    })
  }
}


window.shapeRandom = new Math.seedrandom('aaf')
var defaultActive = shapes.map(d => shapeRandom() < .4)
drawShape('all-shapes')

drawShape('pick-green', ({active, topSel, sel, render}) => {
  active.forEach((d, i) => active[i] = defaultActive[i])
  addMetricBestButton(0, {active, sel, render})
  return addMetrics(metrics.filter(d => d.key == 'green'), {active, topSel})
})

drawShape('pick-triangle', ({active, topSel, sel, render}) => {
  active.forEach((d, i) => active[i] = defaultActive[i])
  addMetricBestButton(1, {active, sel, render})
  return addMetrics(metrics.filter(d => d.key == 'triangle'), {active, topSel})
})

drawShape('pick-metric', grid => {
  grid.active.forEach((d, i) => grid.active[i] = defaultActive[i])

  var metricRender = addMetrics(metrics, grid)
  var totalMetricRender = addTotalMetrics(metrics, measures, grid)
  addMeasures(measures, grid)

  return () => {
    metricRender()
    totalMetricRender()
  }
})


function drawShape(id, initFn=d => e => e){
  var active = shapes.map(d => true)

  var sel = d3.select('#' + id).html('')

  var s = 110

  var topSel = sel.append('div.top')
  var shapeSel = sel.appendMany('div.shape', _.sortBy(shapes, d => d.displayIndex))
    .st({width: s, height: s})
    .on('click', d => {
      active[d.i] = !active[d.i]
      render()
    })

  shapeSel.append('svg')
    .at({width: s, height: s})
    .append('g').translate([s/2, s/2])
    .each(function(d){
      if (d.shape == 'square' || true){
        var rs = Math.round(d.sizeVal*s/3.5)
        var shapeSel = d3.select(this).append('rect')
          .at({x: -rs, y: -rs, width: rs*2, height: rs*2})
      } else if (d.shape == 'circle'){
        var shapeSel = d3.select(this).append('circle')
          .at({r: d.sizeVal*s/3})
      } else if (d.shape == 'triangle'){
        var rs = Math.round(d.sizeVal*s/2.9)
        var shapeSel = d3.select(this).append('path')
          .translate(rs*Math.pow(3,1/2)/10, 1)
          .at({d: [
            'M', 0,                       -rs,
            'L', -rs*Math.pow(3,1/2)/2,   rs/2,
            'L', +rs*Math.pow(3,1/2)/2,   rs/2,
            'Z'
          ].join(' ')})
      }

      if (d.shape == 'triangle'){
        d3.select(this).append('circle')
          .at({r: 4, fill: '#fff', stroke: '#000', strokeWidth: 1})
      }

      shapeSel.at({fill: d.fill, stroke: d.dFill, strokeWidth: 2})
    })

  var customRender = initFn({active, topSel, sel, render})

  shapes.render = render
  function render(){
    shapeSel.classed('active', d => active[d.i])
    // console.log(active.map(d => +d).join(''))

    active.percents = {}
    active.shapes = shapes.filter(d => active[d.i])

    d3.nestBy(active.shapes, d => d.color).forEach(d => {
      active.percents[d.key] = d.length/active.shapes.length
    })
    d3.nestBy(active.shapes, d => d.size).forEach(d => {
      active.percents[d.key] = d.length/active.shapes.length
    })
    d3.nestBy(active.shapes, d => d.shape).forEach(d => {
      active.percents[d.key] = d.length/active.shapes.length
    })


    customRender()
  }
  render()
}