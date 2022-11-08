console.clear()
d3.select('.graph').html('')
// if (window.models) window.models.forEach(d => d.dispose())
// window.models = []
// window.sharedWeights = null


function initWeights(modelIndex, isForceNew){
  if (isForceNew) window.sharedWeights = null

  const weights = window.sharedWeights = window.sharedWeights || (function(){
    const w1 = tf.variable(tf.randomNormal([2, 4]))
    const b1 = tf.variable(tf.randomNormal([4]))
    const w2 = tf.variable(tf.randomNormal([4, 1]))
    const b2 = tf.variable(tf.randomNormal([1]))

    return [w1, b1, w2, b2]
  })()

  return weights.map(util.sliceCopy)
}

async function train(weights, dataset, numEpochs){
  const {xTrainTensor, yTrainTensor} = dataset
  const [w1, b1, w2, b2] = weights

  function model(x){
    return x.matMul(w1).add(b1).tanh().matMul(w2).add(b2).tanh()
  }

  const optimizer = tf.train.sgd(.3)
  for (let epoch = 0; epoch < numEpochs; epoch++){
    optimizer.minimize(() => {
      const predYs = model(xTrainTensor)
      const loss = tf.losses.meanSquaredError(yTrainTensor, predYs)
      return loss
    })
  }

  return {
    predict: model,
    weights: [w1, b1, w2, b2],
  }
}



async function main(sel, modelIndex){
  const dataset = util.genDataDiagonal(modelIndex)
  let model = await train(initWeights(modelIndex), dataset, 0)
  await util.initChart(model, dataset, sel)

  for (let i = 0; i < 10; i++){
    model = await train(model.weights, dataset, 10)
    await util.initChart(model, dataset, sel)
  }
}



window.init = function(){
  d3.select('.graph').html('').appendMany('div.col', d3.range(10))
    .each(function(i){
      main(d3.select(this), i)
    })
}
window.init()

