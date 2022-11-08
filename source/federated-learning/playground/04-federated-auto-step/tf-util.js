window.util = (function(){

  function genDataDiagonal(modelIndex){
    const n = 100

    let data = d3.range(n).map(i => {
      var pad = .03
      const x = [Math.random()*(1 - pad*2) + pad, Math.random()*(1 - pad*2) + pad]
      const y = x[0] < x[1]

      return {x, y}
    })

    data = data.filter(d => Math.abs(d.x[0] - d.x[1]) > .15)

    // data = _.flatten(d3.nestBy(data, d => d.y).map(d => d.slice(0, 2)))

    // data = data.filter(d => modelIndex/12 <= d.x[0] && d.x[0] <= (modelIndex + 3)/12)
    data = data.filter((d, i) => i < 4)

    const rv = {
      data, 
      xTrain: data.map(d => d.x), 
      yTrain: data.map(d => d.y), // TODO: 0 predictions are more unstable
    }

    rv.xTrainTensor = tf.tensor2d(rv.xTrain, [rv.xTrain.length, 2])
    rv.yTrainTensor = tf.tensor2d(rv.yTrain, [rv.yTrain.length, 1])

    return rv
  }


  async function initChart(dataset){
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


    var gs = 20
    var testPoints = d3.cross(d3.range(0, 1 + 1E-9, 1/gs), d3.range(0, 1 + 1E-9, 1/gs))
    var predictions = dataset.model.predict(tf.tensor2d(testPoints)).dataSync()
    // console.log(predictions)

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


  function logWeights(){
    // return
    model.weights.forEach(w => {
     console.log(w.name, w.shape);
     console.log(w.val.dataSync() + '')
    })
  }

  function sliceCopy(x){
    return tf.variable(tf.tensor(x.dataSync().slice(), x.shape))
  }

  return {genDataDiagonal, initChart, logWeights, sliceCopy}
})()

if (window.initAutostep) window.initAutostep()

