/* Copyright 2023 Google LLC. All Rights Reserved.

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

window.util = (function(){

  var data = window.__datacache = window.__datacache || {}

  function getRoot(){
    return `https://storage.googleapis.com/uncertainty-over-space/tiny-transformers`
  }

  async function getFile(path, uploadData={}){
    var [slug, type] = path.replaceAll('..', '').split('.')

    var uploadDataStr = JSON.stringify(uploadData)
    slug = path + ' __ ' + uploadDataStr 
    // TODO: fix?
    if (data[slug + 'xxxxxx']){
      return data[slug]
    }

    var datadir = `https://storage.googleapis.com/uncertainty-over-space/tiny-transformers`

    var res = await fetch(path.includes('..') ? path : datadir + path)

    if (res.status == 500){
      var resText = await res.text()
      console.log(resText, res)
      throw 'up'
    }

    if (type == 'csv'){
      var parsed = d3.csvParse(await res.text())
    } else if (type == 'npy'){
      var parsed = npyjs.parse(await(res).arrayBuffer())
    } else if (type == 'json'){
      var parsed = await res.json()
    } else{
      throw 'unknown type'
    }

    data[slug] = parsed
    return parsed 
  }
  

  var color = d3.interpolatePuOr

  var colors = {
    train: '#8920E9',
    train: '#9730c9',
    test: '#4CB769',

    // aInput: '#2D733D',
    // bInput: '#8920E9',
    aInput: '#2979FF',
    bInput: '#FF6D00',

    highlight: '#b4cc16',
    correct: '#FD4376',

    sweepGrok: '#F7DB5C',
    sweepGen: '#7CB9DF',
    sweepNoGen: '#fff',
    sweepNoLearn: '#aaa',
  }
  d3.entries(colors).forEach(({key, value}) => {
    d3.select('html').style('--color-' + key, value)
  })


  function addAxisLabel(c, xText, yText, xOffset=30, yOffset=-30){
    if (c.isggPlot) xOffset -= 5

    c.svg.select('.x').append('g')
      .translate([c.width/2, xOffset])
      .append('text.axis-label')
      .text(xText)
      .at({textAnchor: 'middle', fill: '#000'})

    c.svg.select('.y')
      .append('g')
      .translate([yOffset, c.height/2])
      .append('text.axis-label')
      .text(yText)
      .at({textAnchor: 'middle', fill: '#000', transform: 'rotate(-90)'})
  }

  function ggPlot(c, isBlack=false){
    c.svg.append('rect.bg-rect')
      .at({width: c.width, height: c.height, fill: isBlack ? '#000' : '#F1F3F4'}).lower()
    c.svg.selectAll('.domain').remove()
    c.isggPlot = true
    ggPlotUpdate(c)
  }

  function ggPlotUpdate(c){
    c.svg.selectAll('.tick').selectAll('line').remove()

    c.svg.selectAll('.y text').at({x: -3})
    c.svg.selectAll('.y .tick')
      .selectAppend('path').at({d: 'M 0 0 H ' + c.width, stroke: '#fff', strokeWidth: 1})

    c.svg.selectAll('.x text').at({y: 4})
    c.svg.selectAll('.x .tick')
      .selectAppend('path').at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1})
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function npy2tfSlice(npyArray, stepIndex){
    var {data, shape} = npyArray
    var stepSize = shape[1]*shape[2]
    var slicedData = data.slice(stepSize*stepIndex, stepSize*(stepIndex + 1))
    slicedData = Float32Array.from(slicedData)
    return tf.tensor2d(slicedData, [shape[1], shape[2]])
  }

  function transpose(arr){
    return arr[0].map((_, i) => arr.map(row => row[i]))
  }

  function initRenderAll(fnLabels){
    var rv = {}
    fnLabels.forEach(label => {
      rv[label] = () => rv[label].fns.forEach(d => d())
      rv[label].fns = []
    })

    return rv
  }

  function titleFmt(str){
    return str
      .replace('hidden_embed_w', 'W_input')
      .replace('out_embed_t_w', 'W_output')
      .replace('hidden_w', 'W_input')
      .replace('out_w', 'W_output')
      .replace('hidden_dft', 'dft_W_input')
      .replace('out_dft', 'dft_W_output')
      .replace('dft_out_embed_w', 'dft_W_output')
      .replace('hidden_size', 'num_neurons')
      .replace('train_size', 'num_train')
      // .replace('w_inproj', 'w_in-projᵀ')
      .replace('w_inproj', 'W_in-proj')
      .replace('w_outproj', 'W_out-proj')
  }

  function keyFmt(str){
    return str
      .replace('hidden_size', 'Num Neurons')
      .replace('train_size', 'Train Examples')
      .replace('weight_decay', 'Weight Decay')
      .replace('embed_size', 'Neurons')
      .replace('learning_rate', 'Learning Rate')
  }

  function addAria(array){
    array.forEach(d => {
      d3.select(d.selector).at({role: 'graphics-document', 'aria-label': d.label})
    })
  }

  return {getFile, color, colors, getRoot, addAxisLabel, ggPlot, ggPlotUpdate, sleep, npy2tfSlice, transpose, initRenderAll, titleFmt, keyFmt, addAria}

})()

// window.initHandWeights?.()
// window.initModBot?.()
window.initModTop?.()

window.initSparseParity?.()
window.initSparseParitySweep?.()




