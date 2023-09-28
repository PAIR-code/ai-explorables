/* Copyright 2020 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

window.draw_canvas_mnist_ensemble = async function(className, imgList, initialImage){
  // tf.setBackend('cpu')
  var maxSteps = 50
  var lastIndexRender = 0

  var sel = d3.select('#' + className).html(`
    <div class='canvas-container'>
      <div class='title'>Model Input</div>
      <canvas></canvas>
      <div class='img-picker'></div>
    </div>

    <div class='panel models'>
      <div class='title'>Predictions</div>
    </div>
  `).classed('paint-container', true)

  var ctx = util.initDrawCanvas({sel, predict})
  util.initImgPicker({sel, predict, ctx, imgList, imgClickCb})

  // var root = 'https://storage.googleapis.com/uncertainty-over-space/explorables/uncertainty-ood/tfjs_models'
  // var root = 'https://storage.googleapis.com/uncertainty-over-space/explorables/uncertainty-ood/tfjs_models/conv-validation_split_.9-model'
  // var modelPromises = d3.range(10).map(i => tf.loadLayersModel(`${root}-${i}/model.json`))
  // var root = 'tfjs_models'
  var root = 'https://storage.googleapis.com/uncertainty-over-space/explorables/uncertainty-ood/tfjs_models/overfit-epoch_2000'
  var modelPromises = d3.range(10).map(i => tf.loadLayersModel(`${root}/${i}/model.json`))
  var allModels = (await Promise.all(modelPromises))
    .concat(null)
    .map((tfModel, i) => {
      var model = {tfModel, i, softmaxLog: [], stackLog: [], isEnsemble: tfModel == null} 
      initModelChart(model)
      return model
    })
  var tfModels = allModels.filter(d => d.tfModel)
  allModels.ensemble = _.last(allModels)
  var imgDataLog = []

  var img = new Image()
  img.addEventListener('load', () => {
    ctx.drawImage(img, 0, 0)
    predict()
  })
  img.src = `img/${initialImage}.jpg`

  // TODO: tf.tidy?
  async function predict(isAutomatic){
    if (!isAutomatic) window.__timer_ensemble?.stop()

    if (lastIndexRender){
      imgDataLog = imgDataLog.slice(lastIndexRender, maxSteps)
      allModels.forEach(model => {
        model.softmaxLog = model.softmaxLog.slice(lastIndexRender, maxSteps)
        model.stackLog = model.stackLog.slice(lastIndexRender, maxSteps)
      })
      renderAllMousemove(0)
    }


    var {imgData, inputTensor} = util.reshape_image_mnist(ctx)
    imgDataLog.unshift(imgData)
    imgDataLog.slice(0, maxSteps)
    tfModels.forEach(model => {
      model.softmaxLog.unshift(model.tfModel.predict(inputTensor).dataSync())
    })

    var softmax = d3.range(10).map(i => d3.mean(tfModels, d => d.softmaxLog[0][i]))
    allModels.ensemble.softmaxLog.unshift(softmax)

    allModels.forEach(d => d.render())

  }

  function initModelChart(model){
    var c = d3.conventions({
      sel: sel.select('.models').append('div'),
      height: 40,
      width: maxSteps*4,
      margin: {right: 100, top: 0, bottom: 6, left: 4},
      layers: 'sd'
    })

    c.x.domain([maxSteps - 1, 0]).clamp(1)
    var area = d3.area()
      .x((d, i) => c.x(i))
      .y0(d => c.y(d[0]))
      .y1(d => c.y(d[1]))
      .curve(d3.curveStepAfter)

    var areaSel = c.svg.appendMany('path', d3.range(10))
      .at({fill: i => util.digitColor[i], stroke: '#fff', strokeWidth: .2})

    var rectWidth = 0
    var rectBgSel = c.svg.append('rect').at({width: rectWidth, height: c.height, x: 130, fillOpacity: .2})
    var rectFgSel = c.svg.append('rect').at({width: rectWidth, height: c.height, x: 130})

    var classPrediction = c.layers[1].append('div').translate([c.width + 10, -2]).st({})
      .st({fontSize: 14, position: 'absolute'})
      .append('span').st({fontWeight: 600})
    var percentPrediction = classPrediction.parent()
      .append('span.predict-percent')

    var modelLabelSel = c.layers[1].append('div').translate([c.width + 150, -1])
      .text('Model ' + 'ABCDEFGHIJK'[model.i])
      .st({fontSize: 14, position: 'absolute', color: '#aaa'})
    if (model.isEnsemble){
      modelLabelSel.text('Ensemble Model')
        .st({color: '#000', lineHeight: '1em', width: 20})
    }

      // .at({x: c.width + 10, y: c.height/2, dy: '.33em', fontSize: 12, fontFamily: 'monospace'})

    model.render = function(){
      renderText(0)

      var stack = []
      var prev = 0
      model.softmaxLog[0].forEach(d => stack.push([prev, prev += d]))
      model.stackLog.unshift(stack)

      model.softmaxLog = model.softmaxLog.slice(0, maxSteps)
      model.stackLog = model.stackLog.slice(0, maxSteps)

      areaSel.at({d: i => area([model.stackLog[0]].concat(model.stackLog).map(d => d[i]))})
      // rectFgSel.at({fill: util.digitColor[topIndex], height: c.height*maxVal, y: c.height*(1 - maxVal)})
    }

    function renderText(index=0){
      var maxVal = d3.max(model.softmaxLog[index])
      var topIndex = model.softmaxLog[index].indexOf(maxVal)
      classPrediction.text(topIndex).st({color: util.digitColor[topIndex]})
      percentPrediction.text(' ' + d3.format('.1%')(maxVal))

      rectBgSel.at({fill: util.digitColor[topIndex], xstroke: util.digitColor[topIndex]})
      rectFgSel.at({fill: util.digitColor[topIndex], width: rectWidth*maxVal})
    }

    var hoverRect = c.svg.append('rect').st({height: c.height, fillOpacity: .8, fill: '#fff'})
    model.renderMousemove = function(index){
      renderText(index)
      hoverRect.at({x: c.x(index), width: c.width - c.x(index)})
    }

    c.layers[1].st({pointerEvents: 'none'})
    c.svg.on('mousemove', function(){
      var index = Math.round(c.x.invert(d3.mouse(this)[0]))
      if (!imgDataLog[index]) return
      window.__timer_ensemble?.stop()
      renderAllMousemove(index)
    })
    c.svg.append('rect').at({y: -20, height: 20, width: c.width, fillOpacity: 0})

  }

  function renderAllMousemove(index){
    allModels.forEach(m => m.renderMousemove(index))
    ctx.putImageData(imgDataLog[index], 0, 0)
    lastIndexRender = index
  }

  function imgClickCb(tensor0, tensor1){
    var imgData = ctx.getImageData(0, 0, 28, 28)
    var array0 = tensor0.dataSync()
    var array1 = tensor1.dataSync()

    if (window.__timer_ensemble) window.__timer_ensemble.stop()
    var interpolateCount = 0
    window.__timer_ensemble = d3.timer(() => {
      if (interpolateCount == maxSteps) window.__timer_ensemble.stop()

      interpolateImg(interpolateCount/maxSteps)
      interpolateCount++
    })

    function interpolateImg(t){
      // t = d3.easePolyInOut.exponent(.4)(d3.clamp(0, t, 1))

      for (let i = 0; i < array0.length; i++){
        let v = array0[i] + t*(array1[i] - array0[i])
        v = Math.round(v*255)

        imgData.data[i*4 + 0] = v
        imgData.data[i*4 + 1] = v
        imgData.data[i*4 + 2] = v
      }

      ctx.putImageData(imgData, 0, 0)
      predict(true)
    }
  }

  var isIntersecting = false
  let observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !isIntersecting){
      isIntersecting = true
      var imgMatchSel = sel.select('.img-picker').selectAll('img').filter((d, i) => i == 18)
      imgMatchSel.on('click')(imgMatchSel.datum())
    }
  }, {threshold: .6})
  observer.observe(sel.node())

}


if (window.init) window.init()
