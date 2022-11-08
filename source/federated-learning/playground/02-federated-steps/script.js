console.clear()
d3.select('.graph').html('')


function initWeights(){
  const weights = window.sharedWeights = window.sharedWeights || (function(){
    const w1 = tf.variable(tf.randomNormal([2, 4]))
    const b1 = tf.variable(tf.randomNormal([4]))
    const w2 = tf.variable(tf.randomNormal([4, 1]))
    const b2 = tf.variable(tf.randomNormal([1]))

    return [w1, b1, w2, b2]
  })()

  return weights.map(util.sliceCopy)
}

function weights2model(weights){
  const [w1, b1, w2, b2] = weights

  function predict(x){
    return x.matMul(w1).add(b1).tanh().matMul(w2).add(b2).tanh()
  }

  return {predict, weights: [w1, b1, w2, b2]}
}

async function train(weights, dataset, numEpochs){
  const model = weights2model(weights.map(util.sliceCopy))
  
  const optimizer = tf.train.sgd(.3)
  for (let epoch = 0; epoch < numEpochs; epoch++){
    optimizer.minimize(() => {
      const predYs = model.predict(dataset.xTrainTensor)
      const loss = tf.losses.meanSquaredError(dataset.yTrainTensor, predYs)
      return loss
    })
  }

  return model
}

async function runFederateRound(datasets, weights, sel){
  util.initChart(weights2model(weights), [], sel.append('div'), 240)

  const smSel = sel.append('div.sm-container')
  for (dataset of datasets){
    dataset.model = await train(weights, dataset, 5)
    await util.initChart(dataset.model, dataset, smSel.append('div'))
  }

  return ['ijk->jk', 'ij->j', 'ijk->jk', 'ij->j'].map((einsumStr, i) => {
    const stackedWeights = tf.stack(datasets.map(d => d.model.weights[i]))

    return tf.einsum(einsumStr, stackedWeights).mul(1/datasets.length)
  })
}

window.init = async function(){
  const datasets = d3.range(9).map(i => util.genDataDiagonal(i))
  let weights = initWeights()

  const graphSel = d3.select('.graph').html('')

  for (const i of d3.range(10)){
    weights = await runFederateRound(datasets, weights, graphSel.append('div.fed-step'))
  }
}
window.init()

