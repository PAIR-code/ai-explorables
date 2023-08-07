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



window.modTopState = window.modTopStateX || {
  isLocked: false,
  // slug: '2023_06_23_12_29_44',
  // // slug: '2023_06_30_11_20_39',
  // slug: '2023_06_30_11_48_11',
  // slug: '2023_07_02_23_11_54',
  slug: '2023_07_09_19_38_17',
  // slug: '2023_07_22_20_23_33', // small, overfit

  stepIndex: 95,
  activeDim: -1,
  isSorted: 0,
  sweepSlug: 'fail-memorize-generalize',

  // slug: '2023_07_20_20_29_11_099260',
  // sweepSlug: 'mlp_modular_addition_sweep',
}

window.initModTop = async function(){
  // console.clear()

  var state = modTopState
  state.modelPath = `/mlp_modular/${state.sweepSlug}/${state.slug}`
  state.renderAll = util.initRenderAll(['step', 'dim'])
  
  state.hyper = await util.getFile(state.modelPath + '/hyper.json')
  window.initAccuracyChart({
    sel: d3.select('.mod-top-accuracy'),
    state,
    isLoss: false,
    width: 600,
    title: "An Example Of Grokking: Memorization Followed By Sudden Generalization"
  })


  // init annotations quickly to avoid pop in
  var annotations = [
    {
      "parent": ".mod-top-accuracy > div",
      "minWidth": 850,
      "html": "The model quickly fits the <b style='color:var(--color-train)'>training data</b> with 100% accuracy...",
      "st": {
        "top": 40,
        "left": 80,
        "width": 170
      },
      "path": "M -4,-38 A 34.887 34.887 0 0 1 -45,-66"
    },
    {
      "parent": ".mod-top-accuracy > div",
      "minWidth": 850,
      "html": "...but doesn't do better than random guessing on the <b style='color:var(--color-test)'>test data</b>",
      "st": {
        "top": 105,
        "left": 110,
        "width": 150,
        "textAlign": "right"
      },
      "path": "M 4,-28 A 15.78 15.78 0 0 1 19,-3"
    },
    {
      "parent": ".mod-top-accuracy > div",
      "minWidth": 850,
      "html": "After more training, accuracy on the test data improves — the model <b>generalizes</b>!",
      "st": {
        "top": 90,
        "left": 320,
        "width": 190
      },
      "path": "M 129,-14 A 42.847 42.847 0 0 0 200,-32"
    },
    {
      "parent": ".mod-top-accuracy > div",
      "minWidth": 850,
      "html": "Mouse over to scrub through training",
      "st": {
        "top": 115,
        "left": 680,
        "width": 130,
        "opacity": 0
      },
      "path": "M 46,-13 A 48.574 48.574 0 0 1 -22.999998092651367,9.000000953674316",
      "class": "scroll-show no-shadow"
    },
    {
      "parent": ".mod-top-waves > div:last-child > div > div",
      "minWidth": 1000,
      "html": "Each line shows a single neuron",
      "st": {
        "top": 75,
        "left": 395,
        "width": 110
      },
      "path": "M 67,-15 A 45.998 45.998 0 0 1 -1,9",
      "class": "no-shadow"
    },
    {
      "parent": ".mod-top-waves > div:last-child > div > div",
      "minWidth": 1050,
      "html": "Neurons repeating 7 times at the end of training are in this row",
      "st": {
        "top": 265,
        "left": 395,
        "width": 145
      },
      "path": "M 64,-70 A 51.92 51.92 0 0 0 9,-124",
      "class": "no-shadow"
    }
  ]
  // window.annotations = annotations
  // annotations.isDraggable = 1
  initSwoopy(annotations)
  var topAccuracySel = d3.select('.mod-top-accuracy').classed('hidden-step', 1)



  if (state.isSorted){
    state.hidden_embed_w = await util.getFile(state.modelPath + '/hidden_embed_w_sorted.npy')
    state.out_embed_t_w = await util.getFile(state.modelPath + '/out_embed_t_w_sorted.npy')
  } else {
    state.hidden_embed_w = await util.getFile(state.modelPath + '/hidden_embed_w.npy')
    state.out_embed_t_w = await util.getFile(state.modelPath + '/out_embed_t_w.npy')
  }
  
  var modWeightSel = d3.select('.mod-top-weights').html('')
  window.initEmbedVis({
    sel: modWeightSel.append('div'),
    state,
    maxY: 5,
    sx: 5,
    sy: 4,
    type: 'hidden_embed_w',
  })
  window.initEmbedVis({
    sel: modWeightSel.append('div'),
    state,
    maxY: 5,
    sx: 5,
    sy: 4,
    type: 'out_embed_t_w',
    xAxisLabel: 'Output Number',
    yAxisLabel: '',
  })

  state.dft_max = await util.getFile(state.modelPath + '/dft_max.json')

  var modWaveSel = d3.select('.mod-top-waves').html('')
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


  state.renderAll.step()

  initAnimateSteps({
    sel: d3.select(`animate[data-animate='top-switches']`),
    state,
    minStep: 30000,
    stepTarget: 49500,
    isBlink: true,
  })


  initSwoopy(annotations)
  var observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        d3.select('.scroll-show').st({opacity: 1})
        topAccuracySel.classed('hidden-step', 0)
      }
    })
  }, {root: null, rootMargin: '0px', threshold: 1.0})
  observer.observe(modWeightSel.node())


  util.addAria([
    {selector: '.mod-top-accuracy', label: `An Example Of Grokking: Memorization Followed By Sudden Generalization. The model quickly fits the training data with 100% accuracy, but doesn't do better than random guessing on the test data. After more training, accuracy on the test data improves — the model generalizes!'`},
    {selector: '.mod-top-weights', label: `W_input and W_output heatmaps`},
    {selector: '.mod-top-waves', label: `W_input and W_output as line charts. They become very wavey at the end of training`},
  ])
}
window.initModTop()
