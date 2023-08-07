// 2023_07_30_21_53_46
// 2023_07_30_21_51_19
// 2023_07_30_21_51_43
// 2023_07_30_21_52_17
// 2023_07_30_21_53_02
// 2023_07_30_21_53_30
// 2023_07_30_21_54_41
// 2023_07_30_21_55_21
// 2023_07_30_21_55_37
// 2023_07_30_21_56_11
// 2023_07_30_21_56_28
// 2023_07_30_21_56_51
// 2023_07_30_21_57_08
// 2023_07_30_21_57_21
// 2023_07_30_21_58_19
// 2023_07_30_21_58_39
// 2023_07_30_21_59_37
// 2023_07_30_22_00_01
// 2023_07_30_22_00_22
// 2023_07_30_22_00_38
// 2023_07_30_22_01_08
// 2023_07_30_22_03_19
// 2023_07_30_22_03_49
// 2023_07_30_22_04_05
// 2023_07_30_22_04_23
// 2023_07_30_22_04_55
// 2023_07_30_22_05_16
// 2023_07_30_22_07_08
// 2023_07_30_22_08_45
// 2023_07_30_22_09_23
// 2023_07_30_22_09_43
// 2023_07_30_22_10_01
// 2023_07_30_22_11_20
// 2023_07_30_22_13_40
// 2023_07_30_22_14_10
// 2023_07_30_22_14_36
// 2023_07_30_22_14_56
// 2023_07_30_22_15_18
// 2023_07_30_22_15_49
// 2023_07_30_22_16_10
// 2023_07_30_22_16_28
// 2023_07_30_22_18_24
// 2023_07_30_22_18_44
// 2023_07_30_22_19_13

// 2023_08_02_05_12_13
// 2023_08_02_07_27_27
// 2023_08_02_07_56_04
// 2023_08_02_07_59_21
// 2023_08_02_08_00_09

window.fiveNeuronsState = window.fiveNeuronsStateX || {
  a: 13, 
  b: 19,
  isLocked: false,

  stepIndex: 500,
  dim: -1,
  slug: '2023_08_02_05_12_13',
  sweepSlug: 'fixed-embed',
}

window.initFiveNeurons = async function(){
  // console.clear()

  var state = fiveNeuronsState
  state.modelPath = `/mlp_modular/${state.sweepSlug}/${state.slug}`
  state.renderAll = util.initRenderAll(['step', 'input', 'dim'])

  state.hyper = await util.getFile(state.modelPath + '/hyper.json')
  state.n_tokens = state.hyper.n_tokens

  var modAccSel = d3.select('.five-neuron-accuracy').html('').append('div')
  window.initAccuracyChart({
    sel: modAccSel.append('div'),
    state,
    isLoss: 0,
  })

  state.w_inproj = await util.getFile(state.modelPath + '/hidden_w.npy')
  state.w_outproj = await util.getFile(state.modelPath + '/out_t_w.npy')

  state.model = {
    w_inproj: d3.range(5),
    w_outproj: d3.range(5),
  }

  // rescale embed chart
  state.renderAll.step.fns.push(() => {
    var maxY = 0
    var {shape} = state.w_inproj
    var offset = shape[1]*shape[2]*state.stepIndex
    for (var i = 0; i < shape[1]; i++){
      for (var j = 0; j < shape[2]; j++){
        var index = offset + shape[2]*i + j

        maxY = Math.max(maxY, Math.abs(state.w_inproj.data[index]))
        maxY = Math.max(maxY, Math.abs(state.w_outproj.data[index]))
      
        if (i == 0){
          state.model.w_inproj[j]  = [state.w_inproj.data[index],  state.w_inproj.data[index + 5]]
          state.model.w_outproj[j] = [state.w_outproj.data[index], state.w_outproj.data[index + 5]]
        }
      }
    }
    state.maxY = maxY
  }) 

  var embedSel = d3.select('.five-neuron-embed').html('')
  window.initEmbedVis({
    sel: embedSel.append('div'),
    state,
    maxY: 20,
    sx: 20,
    sy: 20,
    type: 'w_inproj',
    xAxisLabel: 'Frequency',
    maxY: 'rescale',
    xAxisLabel: 'Input',
    isNoStep: true
  })
  window.initEmbedVis({
    sel: embedSel.append('div'),
    state,
    maxY: 20,
    sx: 20,
    sy: 20,
    type: 'w_outproj',
    xAxisLabel: 'Frequency',
    yAxisLabel: '',
    maxY: 'rescale',
    xAxisLabel: 'Output',
    isNoStep: true
  })


  var circleSel = d3.select('.five-neuron-circle').html('')
  window.initFiveCircle({
    sel: circleSel.append('div'),
    state,
    type: 'w_inproj',
  })
  window.initFiveCircle({
    sel: circleSel.append('div'),
    state,
    type: 'w_outproj',
  })


  var permute = [2, 0, 3, 4, 1]
  var permute = [0, 1, 2, 4, 3]
  var circle2Sel = d3.select('.five-neuron-circle-2').html('')
  window.initFiveCircle({
    sel: circle2Sel.append('div'),
    state,
    type: 'w_inproj',
    permute,
  })
  window.initFiveCircle({
    sel: circle2Sel.append('div'),
    state,
    type: 'w_outproj',
    permute,
  })



  state.renderAll.step()


  initAnimateSteps({
    sel: d3.select(`animate[data-animate='five-neuron-converge']`),
    state,
    minStep: 0,
    stepTarget: 14000,
    duration: 4000,
  })



  var annotations = [
    {
      "parent": ".five-neuron-accuracy > div",
      "minWidth": 850,
      "html": "<b style='color:var(--color-train)'>Train</b> and <b style='color:var(--color-test)'>test</b> accuracy don't diverage; the model is too small to memorize",
      "st": {
        "top": 120,
        "left": 390,
        "width": 200
      },
      "path": "M -3,-52 A 34.838 34.838 0 0 1 -54,-73"
    }
  ]

  // window.annotations = annotations
  // annotations.isDraggable = 1

  initSwoopy(annotations)

  util.addAria([
    {selector: '.five-neuron-accuracy', label: `Accuracy over training. accuracy don't diverage; the model is too small to memorize `},
    {selector: '.five-neuron-embed', label: `W_in-proj and W_out-proj heatmap`},
    {selector: '.five-neuron-circle', label: `Neurons W_in-proj and W_out-proj plotted on a circle`},
    {selector: '.five-neuron-circle-2', label: `W_in-proj and W_out-proj plotted on a circle with connecting lines. They form a star on W_out-proj!`},
    {selector: '.mod-bot-seeds', label: `Small multiple loss charts showing many training runs.`},
  ])

}
window.initFiveNeurons()



