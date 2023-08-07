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



tf.setBackend('cpu')

window.modBotState = window.modBotStateXX || {
  a: 13, 
  b: 19,
  isLocked: false,
  slug: '2023_06_23_12_29_44',
  // slug: '2023_06_30_11_20_39',
  slug: '2023_06_30_11_48_11',

  slug: '2023_07_02_23_03_32',
  slug: '2023_07_02_23_05_15',
  slug: '2023_07_02_23_06_44',
  slug: '2023_07_02_23_08_30',
  // slug: '2023_07_02_23_09_59',
  slug: '2023_07_02_23_11_54', // stars
  // slug: '2023_07_02_23_13_25',
  // slug: '2023_07_02_23_15_44',
  // slug: '2023_07_02_23_17_15',
  // slug: '2023_07_02_23_18_37', // didn't learn, but good stars?
  // slug: '2023_07_02_23_20_11',
  // slug: '2023_07_02_23_21_49',
  // slug: '2023_07_02_23_23_12',
  // slug: '2023_07_02_23_26_08',

  // slug: '2023_07_02_23_39_31',

  // slug: '2023_07_02_23_45_47', // very good starts, not great grok
  // slug: '2023_07_02_23_49_58', // 
  // slug: '2023_07_02_23_51_23', // 
  // slug: '2023_07_02_23_52_42', // 

  // // slow training
  // slug: '2023_07_03_06_14_43', // still snapping into place — train with these hyper longer?
  // slug: '2023_07_03_06_23_41',
  // slug: '2023_07_03_07_35_39', // 10 million steps, nice stars
  
  // slug: '2023_07_03_08_19_55', // .99 percent_train, still not perfect
  // slug: '2023_07_03_08_52_17', // .99 percent_train, huge hidden dim


  // slug: '2023_07_08_22_46_41',
  slug: '2023_07_08_22_56_07',
  slug: '2023_07_08_22_56_07',
  slug: '2023_07_08_22_56_07', // didn't have enough time after training
  // slug: '2023_07_08_23_01_22', // didn't train
  slug: '2023_07_08_22_59_27', // good stars
  // slug: '2023_07_08_23_06_37',
  // slug: '2023_07_09_12_53_12',
  // slug: '2023_07_09_19_11_17', // acc sharp, 3 freqs,
  // slug: '2023_07_09_19_31_22',

  // slug: '2023_07_09_20_05_50', // acc ok, stars ok, 
  // slug: '2023_07_09_20_01_04', // acc great, stars sloopy, 
  // slug: '2023_07_09_19_42_56', // acc ok, stars pretty good (not all finished, but fine?), 
  // slug: '2023_07_09_19_41_30', // acc great, stars fine, 
  slug: '2023_07_09_19_38_17', // acc great, not finished, 
  slug: '2023_07_09_19_38_17-index',
  // slug: '2023_07_09_19_31_22', // acc great, not finished, 
  // slug: '2023_07_09_19_28_34', // acc slow increase, stars great, 
  // slug: '2023_07_09_19_25_31', // lost freq, 
  // slug: '2023_07_09_19_20_45', // acc slow increase..
  // slug: '2023_07_09_16_29_07', // acc sharp, 3 freqs,
  // slug: '2023_07_09_13_04_00', // almost perfect 4, but no low freqs
  // slug: '2023_07_09_12_57_17', // all are lower freq, aqq slow
  // slug: '2023_07_09_12_53_12', // solid 3 freq
  // slug: '2023_07_08_23_06_37', // unfinished 4
  // slug: '2023_07_08_22_57_56', // very good starts and acc, but logits look wrong??

  // slug: '2023_07_08_22_56_07', // unfished 4, but v good
  // slug: '2023_07_08_22_46_41', // last one w/ current fmt

  // slug: '2023_07_22_20_23_33',

  stepIndex: 99,
  dim: -1,
  isSorted: true,
  sweepSlug: 'fail-memorize-generalize',


  // slug: '2023_07_20_20_29_11_099260',
  // sweepSlug: 'mlp_modular_addition_sweep',
}

window.initModBot = async function(){
  // console.clear()

  var state = modBotState
  state.modelPath = `/mlp_modular/${state.sweepSlug}/${state.slug}`
  state.renderAll = util.initRenderAll(['step', 'input', 'dim'])

  state.hyper = await util.getFile(state.modelPath + '/hyper.json')
  state.n_tokens = state.hyper.n_tokens

  var modAccSel = d3.select('.mod-bot-accuracy').html('').append('div')
  window.initAccuracyChart({
    sel: modAccSel.append('div'),
    state,
    isLoss: 0,
  })
  window.initAccuracyChart({
    sel: modAccSel.append('div'),
    state,
    isLoss: 1,
  })

  d3.selectAll('.small-multiple-seed').classed('active', d => d.hyper.slug == state.slug)

  if (state.isSorted){
    state.hidden_embed_w = await util.getFile(state.modelPath + '/hidden_embed_w_sorted.npy')
    state.out_embed_t_w = await util.getFile(state.modelPath + '/out_embed_t_w_sorted.npy')
    state.dft_hidden_embed_w = await util.getFile(state.modelPath + '/dft_hidden_embed_w_sorted.npy')
    state.dft_out_embed_w = await util.getFile(state.modelPath + '/dft_out_embed_w_sorted.npy')
  } else{
    state.hidden_embed_w = await util.getFile(state.modelPath + '/hidden_embed_w.npy')
    state.out_embed_t_w = await util.getFile(state.modelPath + '/out_embed_t_w.npy')
    state.dft_hidden_embed_w = await util.getFile(state.modelPath + '/dft_hidden_embed_w.npy')
    state.dft_out_embed_w = await util.getFile(state.modelPath + '/dft_out_embed_w.npy')
  }
  

  state.dft_max = await util.getFile(state.modelPath + '/dft_max.json')
  state.byFreq = calcByFreq(state)

  // console.log(state.dft_out_embed_w)

  var modWaveSel = d3.select('.mod-bot-waves').html('')
  window.initModTopWaves({
    sel: modWaveSel.append('div'),
    state,
    type: 'hidden_embed_w',
  })
  window.initModTopWaves({
    sel: modWaveSel.append('div'),
    state,
    type: 'out_embed_t_w',
    xAxisLabel: 'Output Number',
    yAxisLabel: '',
  })

  var modDftSel = d3.select('.mod-bot-dft').html('')
  window.initEmbedVis({
    sel: modDftSel.append('div'),
    state,
    maxY: 20,
    sx: 5,
    sy: 4,
    type: 'dft_hidden_embed_w',
    xAxisLabel: 'Frequency',
  })
  window.initEmbedVis({
    sel: modDftSel.append('div'),
    state,
    maxY: 20,
    sx: 5,
    sy: 4,
    type: 'dft_out_embed_w',
    xAxisLabel: 'Frequency',
    yAxisLabel: '',
  })

  window.initModBotFreqs({
    sel: d3.select('.mod-bot-freqs-hidden').html('').append('div'),
    state,
    title: 'hidden_dft',
    stepsKey: 'stepsHidden'
  })
  window.initModBotFreqs({
    sel: d3.select('.mod-bot-freqs-out').html('').append('div'),
    state,
    title: 'out_dft',
    stepsKey: 'stepsOut'
  })

  window.initInputSliders({
    sel: d3.select('.mod-bot-sliders').html(''),
    state,
    hasColor: false,
  })

  window.initModBotLogits({
    sel: d3.select('.mod-bot-logits').html(''),
    state
  })

  state.renderAll.step()
  state.renderAll.input()


  initAnimateSteps({
    sel: d3.select(`animate[data-animate='bot-gen']`),
    state,
    minStep: 0,
    stepTarget: 50000 -1,
  })

  initAnimateSteps({
    sel: d3.select(`animate[data-animate='bot-improve']`),
    state,
    minStep: 45000 -1,
    stepTarget: 50000 - 1,
    duration: 1000
  })


  function calcByFreq(state){
    var {shape} = state.dft_hidden_embed_w
    var {dft_hidden_embed_w, dft_out_embed_w} = state

    // state.dft_max.forEach(d => d.freq = Math.floor((d.max_index - 1)/2))
    if (state.isSorted){
      state.dft_max.forEach(d => d.index = d.index_sorted)
    }
    var byFreq = _.sortBy(d3.nestBy(state.dft_max, d => d.freq), d => +d.key)
    var prevFreqCount = 0
    byFreq.forEach(freq => {
      freq.forEach(hiddenDim => {
        hiddenDim.stepsHidden = d3.range(shape[0]).map(stepIndex => {
          var offset = shape[1]*shape[2]*stepIndex + hiddenDim.index
          var cos = dft_hidden_embed_w.data[offset + shape[2]*(hiddenDim.freq*2 + 1) ]
          var sin = dft_hidden_embed_w.data[offset + shape[2]*(hiddenDim.freq*2 + 2)]
          var norm = Math.sqrt(cos*cos + sin*sin)
          return {cos, sin, norm}
        })

        hiddenDim.stepsOut = d3.range(shape[0]).map(stepIndex => {
          var offset = shape[1]*shape[2]*stepIndex + hiddenDim.index
          var cos = dft_out_embed_w.data[offset + shape[2]*(hiddenDim.freq*2 + 1) ]
          var sin = dft_out_embed_w.data[offset + shape[2]*(hiddenDim.freq*2 + 2)]
          var norm = Math.sqrt(cos*cos + sin*sin)
          return {cos, sin, norm}
        })

        var lastStep = hiddenDim.stepsHidden.at(-1)
        hiddenDim.angle = Math.atan2(lastStep.sin, lastStep.cos)
      })

      freq.sorted = _.sortBy(freq, d => d.angle)
      freq.sorted.forEach((d, i) => {
        d.angleIndex = i + prevFreqCount
        d.prev = freq.sorted.at(i - 1)
      })

      // freq.sorted = _.sortBy(freq, d => d.index)
      // freq.sorted.forEach((d, i) => {
      //   d.angleIndex = d.index
      //   d.prev = freq.sorted.at(i - 1)
      // })

      prevFreqCount += freq.length
    })

    return byFreq
  }

  util.addAria([
    {selector: '.mod-bot-accuracy', label: `Accuracy and loss over training`},
    {selector: '.mod-bot-waves', label: `W_input and W_output plotted as a line chart`},
    {selector: '.mod-bot-dft', label: `discrete Fourier transform of W_input and W_output as a heatmap`},
    {selector: '.mod-bot-freqs-hidden', label: `W_input dft neurons grouped by frequency plotted on a circle`},
    {selector: '.mod-bot-freqs-hidden', label: `W_output dft neurons plotted on a circle. The connections make a star!`},
    {selector: '.mod-bot-sliders', label: `Bar chart showing model logits. They form a wave at the end of training.`},
  ])

}
window.initModBot()
