/* Copyright 2022 Google LLC. All Rights Reserved.

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

window.ttSel = d3.select('body').selectAppend('div.tooltip.tooltip-hidden');

window.colors = {
  cat: d3.interpolatePuOr(0.85),
  dog: d3.interpolatePuOr(0.1),
  right: '#2ea329',
  wrong: '#fe47fe',
};

for (const c of ['cat', 'dog']) {
  document.body.style.setProperty('--' + c, colors[c]);
}

window.colorScale = d3
  .scaleLinear()
  .domain([0, 1])
  .range([colors.cat, colors.dog]);

var modelsIntro = [
  {
    name: 'Model A',
    subtitle: `Normal Model`,
    model: 'N',
    biased_acc: 50,
    unbiased_acc: 50,
    src: 'https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/models/model_N/model.json',
  },
  {
    name: 'Model B',
    subtitle: `Watermark Model`,
    model: 'PC100',
    biased_acc: 50,
    unbiased_acc: 27,
    src: 'https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/models/model_PC100/model_PC100/model.json',
  },
];

window.localImgs = [
  {name: 'cat10_wm'},
  {name: 'cat10'},
  {name: 'cat4_wm'},
  {name: 'cat4'},
  {name: 'cat11_wm'},
  {name: 'cat11'},
  {name: 'dog1_wm'},
  {name: 'dog1'},
  {name: 'dog5_wm'},
  {name: 'dog5'},
  {name: 'dog493_wm'},
  {name: 'dog493'},
];

localImgs.forEach((d) => {
  d.src = `img/${d.name}.jpg`;
});

var footnoteImgs = [
  {src: 'img/catfootnote.jpg', title: 'Input Image'},
  {src: 'img/catfootnote_vg.jpg', title: 'Vanilla Gradient'},
  {src: 'img/catfootnote_gs.jpg', title: 'Gradient Squared'},
];
var footnoteImgsSel = d3
  .select('.footnote-imgs')
  .html('')
  .append('div')
  .st({display: 'flex', marginTop: 15})
  .appendMany('div', footnoteImgs);
footnoteImgsSel
  .append('div')
  .text((d) => d.title)
  .st({fontSize: 10, textAlign: 'center'});
footnoteImgsSel.append('img').at({src: (d) => d.src, width: 100});

console.log('footnote updated');

d3.loadData(
  'data/intro.csv',
  'data/gradients.csv',
  'data/quadrants_eval.csv',
  'data/other_cheats.csv',
  (error, res) => {
    if (error) throw error;
    window.dataIntro = res[0];
    window.dataGrad = res[1];
    window.dataQuad = res[2];
    window.otherBiases = res[3];

    [dataIntro, dataGrad, dataQuad, otherBiases].forEach((data, i) =>
      data.forEach((d) => {
        d.src = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/inputs/${d.name}.jpg`;
      }),
    );

    dataQuad.forEach((d) => {
      d.nameOrigin = d.name.split('_')[0];
      d.srcWm = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/inputs/${d.nameOrigin}_wm.jpg`;
      d.srcWmFree = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/inputs/${d.nameOrigin}.jpg`;
    });

    window.init();
  },
);

window.init = async function () {
  console.clear();

  initIntro('watermark');
  initIntro('normal');

  for (d of modelsIntro) {
    d.tfmodel = await tf.loadLayersModel(d.src);
  }

  var occlusionState = {
    activeImg: localImgs[0],
    numBoxes: 6,
    renderFns: [],
    hoveredGridIndex: null,
  };
  await initOcclusion('manual', occlusionState);
  await initOcclusion('auto', occlusionState);
  occlusionState.renderFns.forEach((fn) => fn());

  window.util = window.initUtil();

  d3.select('.cat-smiley')
    .html('')
    .append('div.center-illustrations')
    .append('img')
    .at({src: 'img/grad_illustration.png', width: 300});

  initGradients();

  // Hack: height off on first init
  function initAllQuads() {
    initQuadrants('intro');
    initQuadrants('fifty');
    initQuadrants('eval-0');
    initQuadrants('eval-100');
    initQuadrants('eval-50');
  }
  initAllQuads();

  initOtherBiases();

  window.initSwoopy();
  window.initMobileScaling();
};

initSwoopy();
