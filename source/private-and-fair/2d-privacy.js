window.state = window.state || {
  scoreSteps: 101,
  nParams: 11,
  nRandLines: 50,
  nMaxRand: 0,
  nBatches: 4,
  learningRate: 22,
}


window.pointData = window.pointData || d3.range(100).map(i => {
  var color = i % 2 ? 0 : 1
  var color0 = color
  var color1 = color

  var σ = .1
  var μ = .2
  if (color){
    var x = d3.randomNormal(1 - μ, σ)()
    var y = d3.randomNormal(1 - μ, σ*1)()
  } else {
    var x = d3.randomNormal(μ, σ)()
    var y = d3.randomNormal(μ, σ*1)()
    y = d3.clamp(0, y, .4)
  }

  x = d3.clamp(.03, x, .97)
  y = d3.clamp(.03, y, .97)

  var bucketX = x*(state.nParams - 1)

  if (i == 51){
    x = .25
    y = .55
    color = 0
    color0 = 0
    color1 = 1
  }

  return {i, x, y, bucketX, color, color0, color1}
})

var updateAllFns = []
var updateAll = () => updateAllFns.forEach(fn => fn())

var updateCircleFns = []
var updateCircle = (d) => updateCircleFns.forEach(fn => fn(d))

var sel = d3.select('.epoch-graph').html('')
  .st({marginTop: 30})
  .at({role: 'graphics-document', 'aria-label': `Grid of charts showing a simple 2d classifer being trained over four epochs. Changing a single outlier point from red to blue makes a big difference in the final model.`})

var dbSel = d3.select('.decision-boundry').html('').append('div')
  .at({role: 'graphics-document', 'aria-label': `Slides to control the level clipping and noise applied the gradient at each step. Increasing the noise enough makes the decision boundries for the models trained on the red and blue outliers overlap.`})

var colorTypes = [{key: 'color1'}, {key: 'color0'}]
sel.appendMany('div', colorTypes)
  .each(drawColorType)

drawBatch(
  dbSel.append('div').parent().append('div'), 
  3, 
  colorTypes[0], 
  colorTypes[1]
)


function drawColorType(ct){
  function calcBatches(){
    var buckets = d3.nestBy(pointData, d => Math.floor(d.bucketX))
    buckets = _.sortBy(buckets, d => +d.key)

    pointData.forEach(d => {
      d.bucketX = d.x*(state.nParams - 1)
    })

    buckets.forEach((bucket, i) => {
      bucket.i = i
      bucket.x = +bucket.key

      bucket.pointData = pointData.filter(d => Math.abs(d.bucketX - bucket.key) < 1)

      bucket.scores = d3.range(state.scoreSteps).map(i => {
        var y = i/(state.scoreSteps - 1)
        var pad = 0

        var score = d3.sum(bucket.pointData, (d, i) => {
          // return d[ct.key] == 0 ? d.y < y - pad : d.y > y + pad

          var dif = 1 - Math.abs(d.bucketX - bucket.x)
          dif = Math.min(dif, .5)
          if (d[ct.key] == 0){
            return d.y < y - pad ? dif : -dif
          } else {
            return d.y > y + pad ? dif : -dif
          }
        })

        return {y, i, score}
      })

      bucket.best = _.maxBy(bucket.scores, d => d.score)

      bucket.scores.forEach(score => {
        var nextScoreIndex = score.i
        var charge = 0

        for (var j = 0; j < state.learningRate; j++){
          var dif = bucket.best.score - bucket.scores[nextScoreIndex]?.score
          charge += dif || 5
          if (bucket.scores[nextScoreIndex | 0].score == bucket.best.score){
            j = state.learningRate
          } else if (charge > 2) {
            nextScoreIndex += nextScoreIndex < bucket.best.i ? 1 : -1
            charge = 0
          }
        }

        score.nextScoreIndex = nextScoreIndex
      })

      bucket.x = (bucket.i +.5)/(state.nParams - 1)
    })

    var rng = new alea(ct.key)

    // random lines x batches x buckets
    var randLines = d3.range(state.nRandLines).map(() => {
      return [buckets.map(d => Math.floor(d.x*state.scoreSteps))]
    })

    function calcNextBatch(){
      randLines.forEach(line => {
        var next = _.last(line).map((scoreIndex, i) => {
          var randInt = Math.round((rng() - .5)*state.nMaxRand)
          return d3.clamp(
            0, 
            buckets[i].scores[scoreIndex | 0].nextScoreIndex + randInt, 
            state.scoreSteps - 1)
        })

        line.push(next)
      })
    }
    d3.range(state.nBatches - 1).forEach(calcNextBatch)

    ct.buckets = buckets
    ct.randLines = randLines
  }
  calcBatches()

  var sel = d3.select(this)

  var render = (function(){
    ct.renderFns = []

    sel
      .append('div.chart-title').text(ct.key == 'color1' ? 'Training a model with an isolated red point' : 'Training a model with an isolated blue point')
      .st({marginLeft: 10, marginBottom: -18, marginTop: -5})
      .parent()
      .appendMany('div', ct.randLines[0])
      .st({display: 'inline-block'})
      .each(function(d, i){ drawBatch(d3.select(this), i, ct)})

    return () => ct.renderFns.forEach(d => d())
  })()

  updateAllFns.push(() => {
    calcBatches()
    render()
  })
}


function drawBatch(sel, batchIndex, ct, ct2){

  var size = ct2 ? 300 : 150
  var mScale = ct2 ? 0 : 1
  var c = d3.conventions({
    sel,
    width: size,
    height: size,
    margin: {left: 10*mScale, right: 10*mScale, top: 20*mScale, bottom: ct2 ? 50 : 20},
    layers: 'scsd',
  })

  var divSel = c.layers[3].st({pointerEvents: 'none'})

  c.layers[0].append('rect')
    .at({width: c.width, height: c.height, fill: '#efefef'})

  c.svg = c.layers[2]

  c.svg.append('rect')
    .at({width: c.width, height: c.height, fill: 'rgba(0,0,0,0)'})

  c.svg.append('text')
    .text('Step ' + (batchIndex + 1))
    .translate([c.width/2, c.height + 13])
    .at({textAnchor: 'middle', fontSize: 10, fill: '#999'})
    .st({opacity: ct2 ? 0 : 1})

  c.x.domain([0, 1]).clamp(1)
  c.y.domain([0, 1]).clamp(1)

  var drag = d3.drag()
    .on('start', () => c.svg.classed('dragging', 1))
    .on('end', () => c.svg.classed('dragging', 0))
    .on('drag', function(d){
      d.x = d3.clamp(.03, c.x.invert(d3.event.x), .97)
      d.y = d3.clamp(.03, c.y.invert(d3.event.y), .97)

      updateCircle(d)
      updateAll()
    })
    .subject(function(d){ return {x: c.x(d.x), y: c.y(d.y)} })

  var circleSel = c.svg.appendMany('circle.point', pointData)
    .at({r: 4, fill: d => util.colors[d[ct.key]]})
    .call(drag)
    .classed('swapped', d => d.color0 != d.color1)
    .translate(d => [c.x(d.x), c.y(d.y)])
    // .call(d3.attachTooltip)

  updateCircleFns.push(d => {
    circleSel
      .filter(e => e == d) // rendering circles is dropping frames ?
      .translate(d => [c.x(d.x), c.y(d.y)])
  })

  if (ct2){
    var defs = c.svg.append('defs');
    defs.append('linearGradient#red-blue-def')
      .append('stop').at({offset: '0%',  'stop-color': util.colors[0]}).parent()
      .append('stop').at({offset: '45%',  'stop-color': util.colors[0]}).parent()
      .append('stop').at({offset: '55%',  'stop-color': util.colors[1]}).parent()
      .append('stop').at({offset: '100%', 'stop-color': util.colors[1]})
    defs.append('linearGradient#blue-red-def')
      .append('stop').at({offset: '0%',  'stop-color': util.colors[1]}).parent()
      .append('stop').at({offset: '45%',  'stop-color': util.colors[1]}).parent()
      .append('stop').at({offset: '55%',  'stop-color': util.colors[0]}).parent()
      .append('stop').at({offset: '100%', 'stop-color': util.colors[0]})

    circleSel
      // .at({r: 1.2})
      .filter(d => d.color0 != d.color1)
      .st({r: 7, fillOpacity: 1})
      .st({fill: 'url(#red-blue-def)'})//, stroke: 'url(#blue-red-def)'})

    var gradientClipAnnoSel = c.svg.append('text.annotation')
      .translate([c.width + 20, -40])
      .tspans(d3.wordwrap('Completely clipping the gradient stops the model from learning anything from the training data.', 25), 14)

    divSel.append('div.annotation')
      .translate([30, c.height + 5])
      .html(`
        <span style='color:${util.colors[0]}'>〰</span> Models trained with the isolated blue point
        <div>
        <span style='color:${util.colors[1]}'>〰</span> Models trained with the isolated red point
      `)
      .st({lineHeight: '1.3em'})
      .selectAll('span').st({fontSize: 20, height: 0, display: 'inline-block', top: 3, position: 'relative', fontWeight: 700})


  }

  function getRandLines(){
    return ct2 ? ct.randLines.concat(ct2.randLines) : ct.randLines
  }

  var ctx = c.layers[1]

  var lineGen = d3.line()
    .x(d => c.x(d.x))
    .y(d => c.y(d.y))
    .curve(d3.curveNatural)
    .context(ctx)

  ct.renderFns.push(() => {
    var scores = ct.buckets[0].scores
    var paddedLineData = getRandLines().map(line => {
      var xyData = line[batchIndex].map((scoreIndex, i) => {
        return {x: ct.buckets[i].x, y: scores[scoreIndex | 0].y}
      })

      return [
        {x: 0, y: batchIndex*state.learningRate ? xyData[0].y : 0},
        ...xyData,
        {x: 1, y: batchIndex*state.learningRate ? _.last(xyData).y : 1}
      ]
    })

    ctx.clearRect(-c.margin.left, -c.margin.top, c.width + c.margin.left + c.margin.right, c.height + c.margin.top + c.margin.bottom)
    paddedLineData.forEach((d, i) => {
      ctx.beginPath()
      ctx.lineWidth = .1
      ctx.strokeStyle = !ct2 ? '#000' : i < ct.randLines.length ? util.colors[1] : util.colors[0]
      lineGen(d)
      ctx.stroke()
    })

    if (ct2){
      gradientClipAnnoSel.st({opacity: state.learningRate == 0 ? 1 : 0})
    }
  })
}


function addSliders(){
  var width = 180
  var height = 30
  var color = '#000'

  var sliders = [
    {key: 'nMaxRand', label: 'Random Noise', r: [0, 30]},
    {key: 'learningRate', label: 'Gradient Clip', r: [30, 0]},
  ]
  sliders.forEach(d => {
    d.value = state[d.key]
    d.xScale = d3.scaleLinear().range([0, width]).domain(d.r).clamp(1)
  })

  var svgSel = dbSel.append('div.sliders').lower()
    .st({marginTop: 5, marginBottom: 5})
    .appendMany('div.slider-container', sliders)
    .append('svg').at({width, height})
    .append('g').translate(120, 0)

  svgSel.append('text.chart-title')
    .text(d => d.label)
    .at({textAnchor: 'end', dy: '.33em', x: -15})

  var sliderSel = svgSel
    .on('click', function(d){
      d.value = d.xScale.invert(d3.mouse(this)[0])
      renderSliders(d)
    })
    .classed('slider', true)
    .st({cursor: 'pointer'})

  var textSel = sliderSel.append('text.slider-label-container')
    .at({y: -20, fontWeight: 500, textAnchor: 'middle', x: 180/2})

  sliderSel.append('rect')
    .at({width, height, y: -height/2, fill: 'rgba(0,0,0,0)'})

  sliderSel.append('path').at({
    d: `M 0 -.5 H ${width}`, 
    stroke: color,
    strokeWidth: 1
  })

  var leftPathSel = sliderSel.append('path').at({
    d: `M 0 -.5 H ${width}`, 
    stroke: color,
    strokeWidth: 3
  })

  var drag = d3.drag()
    .on('drag', function(d){
      var x = d3.mouse(this)[0]
      d.value = d.xScale.invert(x)
      
      renderSliders(d)
    })

  var circleSel = sliderSel.append('circle').call(drag)
    .at({r: 7, stroke: '#000'})

  function renderSliders(d){
    if (d) state[d.key] = d.value

    circleSel.at({cx: d => d.xScale(d.value)})
    leftPathSel.at({d: d => `M 0 -.5 H ${d.xScale(d.value)}`})

    updateAll()
  }
  renderSliders()
}
addSliders()


updateAll()
