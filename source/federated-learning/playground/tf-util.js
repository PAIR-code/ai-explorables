window.util = (function(){

  function genDataDiagonal(modelIndex){
    const n = 100

    let data = d3.range(n).map(i => {
      const x = [Math.random(), Math.random()]
      const y = x[0] < x[1]

      return {x, y}
    })

    data = data.filter(d => modelIndex/10 <= d.x[0] && d.x[0] <= (modelIndex + 3)/10)

    const rv = {
      data, 
      xTrain: data.map(d => d.x), 
      yTrain: data.map(d => d.y), 
    }

    rv.xTrainTensor = tf.tensor2d(rv.xTrain, [rv.xTrain.length, 2])
    rv.yTrainTensor = tf.tensor2d(rv.yTrain, [rv.yTrain.length, 1])

    return rv
  }


  async function initChart(model, dataset, sel, size=80){
    var color = d3.interpolatePuOr
    var colors = [color(.2), color(1 - .2)]

    var c = d3.conventions({
      sel: sel ? sel.append('div') : d3.select('.graph').append('div'),
      height: size,
      width: size,
      margin: {top: 2, left: 4, bottom: 2, right: 4},
      layers: 'cs',
    })
    var ctx = c.layers[0]


    var gs = 20
    var testPoints = d3.cross(d3.range(0, 1 + 1E-9, 1/gs), d3.range(0, 1 + 1E-9, 1/gs))
    var predictions = model.predict(tf.tensor2d(testPoints)).dataSync()
    // console.log(predictions)

    testPoints.forEach((d, i) => {
      ctx.beginPath()
      ctx.fillStyle = color(predictions[i])
      ctx.rect(c.x(d[0]), c.y(d[1]), c.x(1/gs), c.x(1/gs))
      ctx.fill()
    })


    ctx.lineWidth = .2;
    ctx.strokeStyle = '#000';

    dataset.data?.slice(0, 100).forEach(d => {
      ctx.beginPath()
      ctx.arc(c.x(d.x[0]), c.y(d.x[1]), 2, 0, 2*Math.PI, false)
      ctx.fillStyle = colors[+d.y]
      ctx.fill()
      ctx.stroke()
    })

  }


  function logWeights(){
    return
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

if (window.init) window.init()



  // function genDataNormal(modelIndex){
  //   const n = 20
  //   const isFlip = false // modelIndex % 2

  //   const data = d3.range(n).map(i => {
  //     let y = i % 2 == 0
  //     const x = [d3.randomNormal(y ? .2 : .8, .1)(), d3.randomNormal(y ? .2 : .8, .1)()]
  //       .map(d => d3.clamp(0, d, 1))

  //     if (isFlip) y = !y

  //     return {x, y}
  //   })

  //   const rv = {
  //     data, 
  //     xTrain: data.map(d => d.x), 
  //     yTrain: data.map(d => d.y), 
  //   }

  //   rv.xTrainTensor = tf.tensor2d(rv.xTrain, [rv.xTrain.length, 2])
  //   rv.yTrainTensor = tf.tensor2d(rv.yTrain, [rv.yTrain.length, 1])

  //   return rv
  // }
