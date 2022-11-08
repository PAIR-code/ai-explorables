window.initPlaygroundTop = async function(slug){
  var sel = d3.select('.federate-playground.playground-' + slug).html(`

    <div class='federate-playground-graph'></div>

    <div class='caption'>Twelve people periodically merge their models to collaboratively <br>train a shared model — all without sharing their data. 
    <div class='buttons'><div class='reset-models'>Reset</div>
  `)
  if (!sel.node()) return console.log('missing .playground-' + slug)

  var modelSettings = {
    mergeRate: 1000, 
    numTrainingPoints: 3, 
    trainAvoidMid: false,
    forcePair: false,
    numClients: 12, 
    numOutliers: 0, 
    x: 0,
    dpNoise: 0,
  }

  var sharedConfig = {
    sel, 
    slug,
    maxSteps: Infinity,
    dataseed: 0.6470735737485402,
    initialWeights: weights[slug],
    log: [],
    allModelSettings: [modelSettings],
    learningRate: .01,
    mergeAnimation: 2000,
    // onResetModels,
  }
  window.allConfigs[slug] = sharedConfig
  sharedConfig.renderCallback = () => null


  sharedConfig.mergeModelsButton = d3.select('merge-models-inline').html('').st({position: 'relative'})
    .append('div.buttons').st({display: 'inline-block', xfontFamily: 'monospace', xfontSize: 13, xfontWeight: 200})
    .append('div').text('Merge Models')

  var globalSel = d3.select('.global-model').html('')

  showModelTraining(modelSettings, sharedConfig)

  // TODO: pass reset fn?
  var resetFn = sel.select('.buttons').st({display: 'none'}).select('.reset-models').on('click')

  window.__topResetInterval?.stop()
  window.__topResetInterval = d3.interval(() => {
    // sel.transition().duration(1000)
    //   .st({opacity: .5})

    // setTimeout(() => {
    //   sel.st({opacity: 1})
    // }, 1000)

    // resetFn()
  }, 40000)
  

}

window.initPlaygroundStepper = async function(slug){
  // <i class='material-icons'>play_arrow</i></div>
  var sel = d3.select('.federate-playground.playground-' + slug).html(`
    <div class='playground-controls'>
      <div class='buttons'>
        <div class='merge-models'>Merge Models</div>
        <div class='reset-models'><i class='material-icons'>loop</i></div>
        <div class='pause-play'><i class='material-icons'>pause</i></div>
        <div class='local-step'><i class='material-icons'>skip_next</i></div>
      </div>
      <div class='count-display'></div>
    </div>

    <div class='federate-playground-graph'></div>
    <div class='line-chart'></div>
    <div class='global-model'></div>
  `)
  if (!sel.node()) return console.log('missing .playground-' + slug)

  var modelSettings = {
    mergeRate: Infinity, 
    numTrainingPoints: 3, 
    trainAvoidMid: true,
    forcePair: true,
    numClients: 16, 
    numOutliers: 0, 
    x: 0,
    dpNoise: 0,
    renderSpeed: 10
  }

  var sharedConfig = {
    sel, 
    slug,
    maxSteps: Infinity,
    dataseed: 0.6470735737485402,
    initialWeights: weights[slug],
    log: [],
    allModelSettings: [modelSettings],
    onResetModels,
    onMergeModelClick
  }
  window.allConfigs[slug] = sharedConfig


  var lineChart = window.chart.initRescalingLine(sharedConfig)
  sharedConfig.renderCallback = () => {
    lineChart.render()
  }

  sharedConfig.mergeModelsButton = d3.select('merge-models-inline').html('').st({position: 'relative'})
    .append('div.buttons').st({display: 'inline-block', xfontFamily: 'monospace', xfontSize: 13, xfontWeight: 200})
    .append('div').text('Merge Models')


  var globalSel = d3.select('.global-model').html('')
  // globalSel.append('div.axis-label').text('Global Model')
  //   .st({fontSize: 14})

  showModelTraining(modelSettings, sharedConfig)
  
  function onResetModels(){
    var childDataMaps = d3.select('.data-map-users').html('').st({margin: '35px 0px'})
      .append('div').st({width: 738, lineHeight: '0px', margin: '0px auto'})
    
    childDataMaps.appendMany('div', sharedConfig.datasets)
      .st({display: 'inline-block', marginRight: 10, background: '#fff'})
      .each(function(d, i){
        // TODO change to actual names?
        var childData = {data: d.data, sel: d3.select(this), isGrid: 1, label: 'user ' + (i < 10 ? '0' : '') + i}
        window.chart.initHeatmap(childData)
      })

    var allData = {data: _.flatten(sharedConfig.datasets.map(d => d.data)), isGrid: 1, label: 'all user data'}

    allData.sel = d3.select('.data-map-all-points').html('').st({margin: '35px 0px'})
      .append('div').st({margin: '0px auto', width: 80})

    window.chart.initHeatmap(allData, {height: 80, width: 80})

    onMergeModelClick(true)
    // setTimeout(onMergeModelClick, 100)
    d3.select('path.dataset.global').html('').st({strokeWidth: 0})
  }


  var globalData = {
    sel: globalSel.append('div'),
    index: -2,
    sharedConfig,
    isGrid: 1,
    isGlobal: 1
  }
  globalData.sel.datum(globalData)
  globalData.heatmap = window.chart.initHeatmap(globalData)
  sharedConfig.globalData = globalData

  function onMergeModelClick(isFirst){
    if (sharedConfig.globalData){
      globalData.model = sharedConfig.datasets[0].model
      globalData.heatmap.render(true)
      d3.select('path.dataset.global').html('').st({strokeWidth: 1})      
    }

    globalSel.st({opacity: isFirst ? 0 : 1})
  }
  onMergeModelClick(true)
}

window.initPlaygroundOutlier = async function(slug){
  // <i class='material-icons'>play_arrow</i></div>
  var sel = d3.select('.federate-playground.playground-' + slug).html(`
    <div class='federate-playground-graph'></div>
    <div class='line-chart'></div>
  `)
  if (!sel.node()) return console.log('missing .playground-' + slug)

  var modelSettings = {
    mergeRate: 20, 
    numTrainingPoints: 8, 
    numClients: 16, 
    numOutliers: 4, 
    x: 0,
    dpNoise: 0,
    renderSpeed: 10,
    disabledDatasets: d3.range(16).map(d => 0),
    hyperparms: [6/16*2, 0],
    onDatasetClick,
  }

  function onDatasetClick(d, resetModelsFn){
    modelSettings.disabledDatasets[d.index] = !modelSettings.disabledDatasets[d.index] 
    var pctDisabled = d3.mean(modelSettings.disabledDatasets, (d, i) => d ? NaN : i < modelSettings.numOutliers)
    modelSettings.hyperparms = [pctDisabled*3, Math.random()]
    showModelTraining(modelSettings, sharedConfig)
  }

  var sharedConfig = {
    sel, 
    slug,
    maxSteps: 98,
    dataseed: 'hello1',
    initialWeights: weights[slug],
    log: [],
    allModelSettings: [modelSettings],
    lineColorScale: d => d3.interpolateCool(d3.clamp(0, 1 - d, 1)),
    lineLegend: 'Outliers'
  }
  window.allConfigs[slug] = sharedConfig


  var lineChart = window.chart.initLine(sharedConfig)
  sharedConfig.renderCallback = lineChart.render

  showModelTraining(modelSettings, sharedConfig)


  d3.select('span.cold').st({background: d3.interpolatePuOr(.1), padding: '0px 2px', color: '#fff'})
  d3.select('span.hot') .st({background: d3.interpolatePuOr(.9), padding: '0px 2px', color: '#fff'})
  d3.select('span.outlier').st({background: d3.interpolatePuOr(.1), padding: '0px 2px', color: '#fff'})
}


window.initPlaygroundDp = async function(slug){
  // <i class='material-icons'>play_arrow</i></div>
  var sel = d3.select('.federate-playground.playground-' + slug).html(`
    <div class='federate-playground-graph'></div>
    <div class='slider'></div>
    <div class='line-chart'></div>
  `)
  if (!sel.node()) return console.log('missing .playground-' + slug)

  var modelSettings = {
    mergeRate: 20, 
    numTrainingPoints: 8, 
    numClients: 16, 
    numOutliers: 1,
    disabledDatasets: d3.range(16).map(d => 0),
    x: 0,
    dpNoise: 0,
    renderSpeed: 10,
  }
  modelSettings.hyperparms = [modelSettings.dpNoise, Math.random(), modelSettings.disabledDatasets[0]]

  function onSliderDrag(d){
    modelSettings.dpNoise = d
    sharedConfig.datasets.forEach(dataset => {
      dataset.data.forEach(d => {
        d.x = tfUtil.calcDpNoise(d.xOrig, d.dpNoise, modelSettings)
      })
    })

    window['__localsteptimerdp'].stop()
  }


  async function onSliderDragEng(){
    modelSettings.disabledDatasets[0] = 0 
    modelSettings.hyperparms = [modelSettings.dpNoise, Math.random(), 0]
    await new Promise(cb => showModelTraining(modelSettings, sharedConfig, cb))

    modelSettings.disabledDatasets[0] = 1 
    modelSettings.hyperparms = [modelSettings.dpNoise, Math.random(), 1]
    await new Promise(cb => showModelTraining(modelSettings, sharedConfig, cb))

    // // p hack dataseed
    // modelSettings.dpNoise = 2.5

    // modelSettings.disabledDatasets[0] = 0 
    // modelSettings.hyperparms = [modelSettings.dpNoise, Math.random(), 0]
    // await new Promise(cb => showModelTraining(modelSettings, sharedConfig, cb))

    // modelSettings.disabledDatasets[0] = 1 
    // modelSettings.hyperparms = [modelSettings.dpNoise, Math.random(), 1]
    // await new Promise(cb => showModelTraining(modelSettings, sharedConfig, cb))

    // var [a, b, c, d] = sharedConfig.log.filter(d => d.counts.local == 98).map(d => d.accuracy)
    // var lowDpDiff = b - a
    // var highDpDiff = d - c
    // var diffDiff = lowDpDiff - highDpDiff
    // var dataseed = sharedConfig.dataseed
    // var rv = {diffDiff, highDpDiff, lowDpDiff, a, b, c, d, dataseed}

    // console.log(rv)
    // window.accuracyLog = window.accuracyLog || []
    // accuracyLog.push(rv)

    // sharedConfig.log = []
    // sharedConfig.dataseed = Math.random()
    // modelSettings.dpNoise = 0

    // setTimeout(onSliderDragEng, 10)
  }

  var sharedConfig = {
    sel, 
    slug,
    maxSteps: 198,
    dataseed:0.15928366676862016,
    initialWeights: weights[slug],
    log: [],
    allModelSettings: [modelSettings],
    lineColorScale: d => d3.interpolateWarm(d3.clamp(0, d/5, 1)),
    lineLegend: 'Privacy →',
    hasDashedLegend: true,
    onSliderDrag,
    onSliderDragEng,
  }
  window.allConfigs[slug] = sharedConfig


  var lineChart = window.chart.initLine(sharedConfig)
  sharedConfig.renderCallback = lineChart.render

  onSliderDragEng()
  // showModelTraining(modelSettings, sharedConfig)
}









if (window.init) window.init()


