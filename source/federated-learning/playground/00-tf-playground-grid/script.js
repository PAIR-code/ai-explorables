console.clear()
d3.select('.graph').html('')
if (window.models) window.models.forEach(d => d.dispose())
window.models = []


const dataset = util.genDataDiagonal()


// async function train(){
//   const model = tf.sequential({
//    layers: [
//      tf.layers.dense({inputShape: [2], units: 4, activation: 'tanh'}),
//      // tf.layers.dense({inputShape: [2], units: 2, activation: 'tanh'}),
//      tf.layers.dense({units: 1, activation: 'tanh'}),
//    ]
//   })

//   model.compile({
//     optimizer: tf.train.sgd(.1),
//     loss: 'binaryCrossentropy', 
//     metrics:['accuracy']
//   })

//   const xTrain = tf.tensor2d(dataset.xTrain, [dataset.xTrain.length, 2])
//   const yTrain = tf.tensor2d(dataset.yTrain, [dataset.yTrain.length, 1])

//   const info = await model.fit(xTrain, yTrain, {
//     epochs: 10,
//     batchSize: xTrain.length,
//   })
//   await initChart(model)

//   window.models.push(model)
// }


async function trainCore(){
  const {xTrainTensor, yTrainTensor} = dataset
 
  const w1 = tf.variable(tf.randomNormal([2, 4]))
  const b1 = tf.variable(tf.randomNormal([4]))
  const w2 = tf.variable(tf.randomNormal([4, 1]))
  const b2 = tf.variable(tf.randomNormal([1]))

  function model(x){
    return x.matMul(w1).add(b1).tanh().matMul(w2).add(b2).tanh()
  }

  const optimizer = tf.train.sgd(.3)
  for (let epoch = 0; epoch < 60; epoch++){
    optimizer.minimize(() => {
      const predYs = model(xTrainTensor)
      const loss = tf.losses.meanSquaredError(yTrainTensor, predYs)
      return loss
    })
  }

  const modelShim = {
    predict: model,
    dispose: _ => _, // TODO 
  }
  await util.initChart(modelShim, dataset)

  window.models.push(modelShim)

}


window.init = function(){
  d3.select('.graph').html('')
  d3.range(10).forEach(trainCore)

}

window.init()

