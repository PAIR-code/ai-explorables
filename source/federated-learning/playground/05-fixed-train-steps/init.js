console.clear()

d3.select('.federate-auto-playground').html(`
  <div class='buttons'>
    <div class='local-step'>One Local Epoch 🧠</div>
    <div class='merge-models'>Merge Models</div>
    <div class='reset-models'>Reset ↺</div>
  </div>
  <div class='federate-auto-playground-graph'></div>
`)

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
  const datasets = d3.range(5).map(util.genDataDiagonal)
  window.datasets = datasets

  resetModels()

  const datatsetSel = d3.select('.federate-auto-playground-graph').html('')
    .appendMany('div.dataset', datasets)
    .each(async function(d){
      d.sel = d3.select(this) 
      d.chart = await util.initChart(d)
    })

  function resetModels(){
    datasets.forEach(d => {
      d.model = weights2model(initWeights(true))
    })
  }

  function renderModels(){
    datasets.forEach(d => d.chart?.render())
  }

  var isIntersecting = false
  var stepCount = 0
  let observer = new IntersectionObserver(entries => {
    if (isIntersecting == entries[0].isIntersecting) return
    // console.log(entries[0])

    isIntersecting = entries[0].isIntersecting

    if (window.__localsteptimer) window.__localsteptimer.stop()

    if (isIntersecting){
      var step = 0
      window.__localsteptimer = d3.interval(() => {
        localStep()
        stepCount++
        if (stepCount % 100 == 0) mergeModels()
        setTimeout(renderModels, 50)
        step += 1
        if (step % 10 == 0) {
          mergeModels()
        }
      }, 100)
    }
  }, {threshold: 1})
  observer.observe(datatsetSel.node())

  d3.select('.local-step').on('click', () => {
    localStep()
    setTimeout(renderModels, 50)
  }).st({display: 'none'})

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

