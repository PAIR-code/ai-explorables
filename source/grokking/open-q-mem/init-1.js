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

window.initOpenQMem1 = async function () {
  // console.clear()

  var state = {
    slug: '2023_07_22_20_37_01',

    stepIndex: 4,
    activeDim: -1,
    isSorted: 1,
    sweepSlug: 'fail-memorize-generalize',
  };
  state.modelPath = `/mlp_modular/${state.sweepSlug}/${state.slug}`;
  state.renderAll = util.initRenderAll(['step', 'dim']);

  state.hyper = await util.getFile(state.modelPath + '/hyper.json');
  window.initAccuracyChart({
    sel: d3.select('.open-q-mem-1-accuracy'),
    state,
    isLoss: 1,
    width: 400,
    yExtent: [1e-1, 1e-8],
    // title: "An Example Of Grokking: Memorization Followed By Sudden Generalization"
  });

  if (state.isSorted) {
    state.hidden_embed_w = await util.getFile(
      state.modelPath + '/hidden_embed_w_sorted.npy',
    );
    state.out_embed_t_w = await util.getFile(
      state.modelPath + '/out_embed_t_w_sorted.npy',
    );
  } else {
    state.hidden_embed_w = await util.getFile(
      state.modelPath + '/hidden_embed_w.npy',
    );
    state.out_embed_t_w = await util.getFile(
      state.modelPath + '/out_embed_t_w.npy',
    );
  }

  // rescale embed chart
  state.renderAll.step.fns.push(() => {
    var maxY = 2;
    var {shape} = state.hidden_embed_w;
    var offset = shape[1] * shape[2] * state.stepIndex;
    for (var i = 0; i < shape[1]; i++) {
      for (var j = 0; j < shape[2]; j++) {
        var index = offset + shape[2] * i + j;

        maxY = Math.max(maxY, Math.abs(state.hidden_embed_w.data[index]));
        maxY = Math.max(maxY, Math.abs(state.out_embed_t_w.data[index]));
      }
    }
    state.maxY = maxY;
  });

  var modWeightSel = d3
    .select('.open-q-mem-1-weights')
    .html('')
    .st({pointerEvents: 'none'});
  window.initEmbedVis({
    sel: modWeightSel.append('div'),
    state,
    maxY: 'rescale',
    sx: 5,
    sy: 6,
    type: 'hidden_embed_w',
  });
  window.initEmbedVis({
    sel: modWeightSel.append('div'),
    state,
    maxY: 'rescale',
    sx: 5,
    sy: 6,
    type: 'out_embed_t_w',
    xAxisLabel: 'Output Number',
    yAxisLabel: '',
  });

  state.renderAll.step();
};
window.initOpenQMem1();
