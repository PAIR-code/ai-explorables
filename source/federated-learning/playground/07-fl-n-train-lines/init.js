// 

d3.select('.federate-auto-playground').html(`
  <div class='hyperparm-options'></div>
  <div class='line-chart'></div>

  <div class='buttons'>
    <div class='local-step'>One Local Epoch 🧠</div>
    <div class='merge-models'>Merge Models</div>
    <div class='reset-models'>Reset ↺</div>
  </div>
  <div class='count-display'></div>
  <div class='federate-auto-playground-graph'></div>
`)

tf.setBackend('cpu')


window.

window.initWeightsCache = window.initWeightsCache || []
function initWeights(datasetIndex){
  var cachedWeights = window.initWeightsCache[datasetIndex]
  if (cachedWeights){
    return cachedWeights.map(util.sliceCopy)
  }

  const weights = (function(){
    const w1 = tf.variable(tf.randomNormal([2, 4]))
    const b1 = tf.variable(tf.randomNormal([4]))
    const w2 = tf.variable(tf.randomNormal([4, 1]))
    const b2 = tf.variable(tf.randomNormal([1]))

    return [w1, b1, w2, b2]
  })()

  window.initWeightsCache[datasetIndex] = weights.map(util.sliceCopy)

  return weights
}

function weights2model(weights){
  const [w1, b1, w2, b2] = weights

  function predict(x){
    return x.matMul(w1).add(b1).tanh().matMul(w2).add(b2).tanh()
  }

  return {predict, weights: [w1, b1, w2, b2]}
}

function localStep(datasets){
  datasets.forEach(d => {
    tf.train.sgd(.1).minimize(() => {
      const predYs = d.model.predict(d.xTrainTensor)
      // huberLoss hingeLoss meanSquaredError
      const loss = tf.losses.meanSquaredError(d.yTrainTensor, predYs)
      return loss
    })
  })

  // above callback is synchronous w/ cpu runtime
  // test with: console.log(datasets[0].model.weights[0].dataSync())

  datasets.counts.local++
  logStep(datasets)
}

function mergeModels(datasets){
  const mergedWeights = ['ijk->jk', 'ij->j', 'ijk->jk', 'ij->j']
    .map((einsumStr, i) => {
      const stackedWeights = tf.stack(datasets.map(d => d.model.weights[i]))
      const rv = tf.einsum(einsumStr, stackedWeights).mul(1/datasets.length)
      stackedWeights.dispose()
      return rv
    })

  datasets.forEach(d => {
    d.model.weights.forEach(d => d.dispose())
    d.model = weights2model(mergedWeights.map(util.sliceCopy))
  })
  mergedWeights.forEach(d => d.dispose())

  datasets.counts.merge++
  logStep(datasets)
}

var calcAccuracy = (function(){
  var gs = 20
  var testPoints = d3.cross(d3.range(0, 1 + 1E-9, 1/gs), d3.range(0, 1 + 1E-9, 1/gs))
  var testPointsTensor = tf.tensor2d(testPoints)

  return (dataset) => {
    var predictions = dataset.model.predict(testPointsTensor).dataSync()
    
    return d3.mean(testPoints, (d, i) => {
      var v = predictions[i]
      return d[1] < d[0] ? v < .5 : v > .5
      // return d[1] < d[0] ? Math.abs(1 - v) : Math.abs(v)
    })
  }
})()

function logStep(datasets){
  // TODO save weights to replay?
  var rv = {
    counts: {...datasets.counts},
    accuracy: d3.mean(datasets, calcAccuracy),
    hyperparm: datasets.hyperparm
  } 

  window.log.push(rv)
}

async function trainModel(modelSettings, sharedConfig, finishCallback){
  var seed = new Math.seedrandom('hello4')
  var random = d3.randomUniform.source(seed)()

  const datasets = d3.range(modelSettings.clients)
    .map(index => {
      var isAdversary = index < modelSettings.numOutliers
      var rv = util.genDataDiagonal(index, isAdversary, modelSettings.numTrainingPoints, random)
      rv.isAdversary = isAdversary
      rv.index = index
      return rv
    })
  window.datasets = datasets

  resetModels()

  const datatsetSel = d3.select('.federate-auto-playground-graph').html('')
    .appendMany('div.dataset', datasets)
    .each(function(d){
      d.sel = d3.select(this) 
      d.chart = util.initChart(d)
    })

  var countSel = d3.select('.count-display').html('')
    .appendMany('span', ['local', 'merge'])

  function resetModels(){
    datasets.forEach(d => {
      d.model = weights2model(initWeights(d.index))
    })

    datasets.counts = {local: 0, merge: 0, ms: 0}
    datasets.log = []
    datasets.hyperparm = JSON.stringify(modelSettings)
    logStep(datasets)
  }

  function renderModels(){
    datasets.forEach(d => d.chart.render())

    window.lineChart.render(window.log)
    countSel
      .text(key => key + ' count: ' + Math.round(datasets.counts[key]))
  }

  var isIntersecting = false
  let observer = new IntersectionObserver(entries => {
    isIntersecting = entries[0].isIntersecting
  }, {threshold: 1})
  observer.observe(datatsetSel.node())


  if (window.__localsteptimer) window.__localsteptimer.stop()
  window.__localsteptimer = d3.timer(ms => {
    if (!isIntersecting) return

    datasets.counts.ms = ms
    localStep(datasets)
    localStep(datasets)
    if (datasets.counts.local % modelSettings.mergeRate == 0) mergeModels(datasets)

    if (datasets.counts.local >= sharedConfig.maxSteps){
      window.__localsteptimer.stop()
      finishCallback()
    }
  })

  if (window.__rendertimer) window.__rendertimer.stop()
  window.__rendertimer = d3.interval(ms => {
    if (!isIntersecting) return

    renderModels()
  }, 100)

  d3.select('.local-step').on('click', () => {
    localStep(datasets)
    renderModels()
  }).st({display: 'xnone'})

  d3.select('.merge-models').on('click', () => {
    mergeModels(datasets)
    renderModels()
  })

  d3.select('.reset-models').on('click', () => {
    resetModels()
    renderModels()
  })

  renderModels()
}

window.startTrainingLoop = async function(sharedConfig){
  window.log = []
  window.lineChart = util.initLineChart(sharedConfig)

  for (hyperparm of sharedConfig.hyperparms){
    await new Promise(cb => trainModel(
      // {mergeRate: hyperparm, numTrainingPoints: 4}, 
      // {mergeRate: 20, numTrainingPoints: hyperparm}, 
      // {mergeRate: 40, numTrainingPoints: 8, clients: 16, numOutliers: 0, x: hyperparm}, 
      {mergeRate: 40, numTrainingPoints: 8, clients: 16, numOutliers: hyperparm, x: 0}, 
      
      sharedConfig,
      cb))
  }
}


window.init = async function(){
  console.clear()

  function valueWrap(activeVal){
    return function(v){
      return {v, isActive: v == activeVal}
    }
  }

  var options = [
    {
      key: 'numTrainingPoints',
      values: [1, 2, 4, 8, 16, 32].map(valueWrap(4)), 
    }, 
    {
      key: 'mergeRate',
      values: [2, 5, 10, 20, 40, 80].map(valueWrap(40)), 
    }, 
    {
      key: 'numOutliers',
      values: [0, 2, 4, 6, 8].map(valueWrap(0)), 
    }, 
    {
      key: 'numClients',
      values: [2, 4, 8, 16].map(valueWrap(16)), 
    }, 
    {
      key: 'dpNoise',
      values: [0].map(valueWrap(0)), 
    }, 
  ]
  options.forEach(option => {
    option.values.forEach(d => d.option = option)
  })

  // var optionSel = d3.select('.hyperparm-options').html('')
  //   .appendMany('div.option', options)

  // optionSel.append('div.option-title').text(d => d.key).st({fontWeight: 600})

  // var optionValueSel = optionSel.appendMany('div.option-value', d => d.values)
  //   .text(d => d.v)

  // renderOptions()

  // function renderOptions(){
  //   optionValueSel.classed('active', d => d.isActive)
  // }


  var sharedConfig = {
    maxSteps: 198,
    // hyperparms: [1, 2, 4, 8, 16, 32],
    hyperparms: [2, 5, 10, 20, 40, 80, 160, 320].reverse(),
    hyperparms: [2, 5, 10, 20, 40].reverse(),
    hyperparms: [1, 2, 5, 10, 20],
    hyperparms: [0, 1, 2, 3, 4, 5, 7],
    // hyperparms: [0, 2, 5, 7, 8, 9, 10, 11, 12],
    // hyperparms: [0, 0, 0, 0, 0],
    // hyperparms: [0],
  }

  startTrainingLoop(sharedConfig)
}

window.init()

