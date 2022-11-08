console.clear()
d3.select('.graph').html('')

tf.setBackend('cpu')



function initWeights(forceReset){
  if (forceReset) window.sharedWeights = null

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

async function localStep(){
  datasets.forEach(d => {
    tf.train.sgd(.1).minimize(() => {
      const predYs = d.model.predict(d.xTrainTensor)
      const loss = tf.losses.meanSquaredError(d.yTrainTensor, predYs)
      return loss
    })
  })
}

function mergeModels(){
  const mergedWeights = ['ijk->jk', 'ij->j', 'ijk->jk', 'ij->j']
    .map((einsumStr, i) => {
      const stackedWeights = tf.stack(datasets.map(d => d.model.weights[i]))
      return tf.einsum(einsumStr, stackedWeights).mul(1/datasets.length)
    })

  datasets.forEach(d => d.model = weights2model(mergedWeights.map(util.sliceCopy)))
}

window.init = async function(){
  const datasets = d3.range(9).map(util.genDataDiagonal)
  window.datasets = datasets

  resetModels()

  const datatsetSel = d3.select('.graph').html('')
    .appendMany('div.dataset', datasets)
    .each(function(d){ d.sel = d3.select(this) })

  function resetModels(){
    datasets.forEach(d => {
      d.model = weights2model(initWeights(true))
    })
  }

  function renderModels(){
    datasets.forEach(util.initChart)
  }


  d3.select('.local-step').on('click', () => {
    localStep()
    setTimeout(renderModels, 50)
  })

  d3.select('.merge-models').on('click', () => {
    mergeModels()
    setTimeout(renderModels, 50)
  })

  d3.select('.reset-models').on('click', () => {
    initWeights(true)
    resetModels()
    setTimeout(renderModels, 50)
  })


  renderModels()


}
window.init()

