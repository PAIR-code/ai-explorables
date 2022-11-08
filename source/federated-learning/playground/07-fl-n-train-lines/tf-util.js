window.util = (function(){

  function genDataDiagonal(datasetIndex, isAdversary, numTrainingPoints=4, random=Math.random){
    var n = 100

    let data = d3.range(n).map(i => {
      var pad = .03
      var x = [random()*(1 - pad*2) + pad, random()*(1 - pad*2) + pad]
      var y = x[0] < x[1]
      if (isAdversary) y = !y

      return {x, y}
    })

    // data = data.filter(d => Math.abs(d.x[0] - d.x[1]) > .15)

    // data = _.flatten(d3.nestBy(data, d => d.y).map(d => d.slice(0, 2)))

    // data = data.filter(d => datasetIndex/12 <= d.x[0] && d.x[0] <= (datasetIndex + 3)/12)
    data = data.filter((d, i) => i < numTrainingPoints)

    const rv = {
      data, 
      xTrain: data.map(d => d.x), 
      yTrain: data.map(d => d.y), // TODO: 0 predictions are more unstable
    }

    rv.xTrainTensor = tf.tensor2d(rv.xTrain, [rv.xTrain.length, 2])
    rv.yTrainTensor = tf.tensor2d(rv.yTrain, [rv.yTrain.length, 1])

    return rv
  }

  var addAxisLabel = (c, xText, yText, xOffset=40, yOffset=-40) => {
    c.svg.select('.x').append('g')
      .translate([c.width/2, xOffset])
      .append('text.axis-label')
      .text(xText)
      .at({textAnchor: 'middle'})
      .st({fill: '#000', fontSize: 14})

    c.svg.select('.y')
      .append('g')
      .translate([yOffset, c.height/2])
      .append('text.axis-label')
      .text(yText)
      .at({textAnchor: 'middle', transform: 'rotate(-90)'})
      .st({fill: '#000', fontSize: 14})
  }

  var ggPlotBg = (c, isBlack=true) => {
    c.svg.append('rect')
      .at({width: c.width, height: c.height, fill: '#eee'})
      .lower()

    c.svg.selectAll('.tick').selectAll('line').remove()
    c.svg.selectAll('.y .tick')
      .append('path').at({d: 'M 0 0 H ' + c.width, stroke: '#fff', strokeWidth: 1})
    c.svg.selectAll('.y text').at({x: -3})
    c.svg.selectAll('.x .tick')
      .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1})
  }


  function initLineChart(sharedConfig){
    var c = d3.conventions({
      sel: d3.select('.line-chart').html(''),
      height: 300,
      width: 500,
      margin: {left: 100, bottom: 50}
    })

    var colorScale = d3.interpolateWarm

    c.x.domain([0, sharedConfig.maxSteps])
    c.y.domain([.4, 1])

    c.yAxis.tickFormat(d3.format('.0%')).ticks(5)

    d3.drawAxis(c)
    addAxisLabel(c, 'Local Steps', 'Average Accuracy')
    ggPlotBg(c)

    var lineSel = c.svg.append('g')

    function render(log){
      var byKey = d3.nestBy(log, d => d.hyperparm)

      // byKey.forEach(key => {
      //   var byMergeCount = d3.nestBy(key, d => d.counts.merge)
      //   byMergeCount.forEach(d => d[0].isFirstMerge = true)
      // })

      // byKey = _.sortBy(byKey, d => +d[0].key)

      var line = d3.line()
        .x(d => c.x(d.counts.local))
        .y(d => c.y(d.accuracy))

      lineSel
        .html('')
        .appendMany('path', byKey)
        .at({
          stroke: (d, i) => colorScale(i/sharedConfig.hyperparms.length),
          fill: 'none',
          d: line,
          // d: d => line(d.filter(d => d.isFirstMerge)),
        })

    }

    return {render}
  }



  function initChart(dataset){
    var color = d3.interpolatePuOr
    var colors = [color(.2), color(1 - .2)]

    // TODO reuse DOM
    var c = d3.conventions({
      sel: dataset.sel.html('').append('div'),
      height: 80,
      width: 80,
      margin: {top: 1, left: 4, bottom: 1, right: 8},
      layers: 'cs',
    })
    var ctx = c.layers[0]
    c.sel.st({outline: dataset.isAdversary ? '1px solid #f0f' : ''})


    var gs = 20
    var testPoints = d3.cross(d3.range(0, 1 + 1E-9, 1/gs), d3.range(0, 1 + 1E-9, 1/gs))
    var testPointsTensor = tf.tensor2d(testPoints)


    function render(){
      var predictions = dataset.model.predict(testPointsTensor).dataSync()

      testPoints.forEach((d, i) => {
        ctx.beginPath()
        ctx.fillStyle = color(predictions[i])
        ctx.rect(c.x(d[0]), c.y(d[1]), c.x(1/gs), c.x(1/gs))
        ctx.fill()
      })

      ctx.lineWidth = .2;
      ctx.strokeStyle = '#000';

      dataset.data?.forEach(d => {
        ctx.beginPath()
        ctx.arc(c.x(d.x[0]), c.y(d.x[1]), 2.5, 0, 2.5*Math.PI, false)
        ctx.fillStyle = colors[+d.y]
        ctx.fill()
        ctx.stroke()
      })
    }

    render()

    return {render}
  }


  function logWeights(){
    // return
    model.weights.forEach(w => {
     console.log(w.name, w.shape);
     console.log(w.val.dataSync() + '')
    })
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }


  function sliceCopy(x){
    return tf.variable(tf.tensor(x.dataSync().slice(), x.shape))
  }

  return {genDataDiagonal, initChart, logWeights, sliceCopy, initLineChart, sleep}
})()

if (window.init) window.init()

