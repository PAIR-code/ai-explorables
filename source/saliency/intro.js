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

window.initIntro = async function (slug) {
  var modelsSel = d3
    .select('.intro-models-' + slug)
    .html(`<div class='models-container'></div>`);
  if (!modelsSel.node()) return console.log('missing .intro-models-' + slug);

  var divSel = modelsSel
    .select('.models-container')
    .appendMany('div', modelsIntro)
    .st({position: 'relative'});

  var divTitle = divSel.append('div.title');
  divTitle
    .append('div.legend')
    .text((d) => d.name)
    .st({textAlign: 'center'});

  var modelSel = divSel
    .append('div.model-showcase')
    .st({marginTop: 3, height: 220});

  var accSel = divSel.append('div.title').append('div.accuracy');

  function renderImgs(testingSet) {
    modelSel.each(function (dataModel) {
      for (const c of ['cat', 'dog']) {
        var activeData = window.dataIntro.filter(
          (d) => d.testingSet == testingSet,
        );
        data = activeData.filter(
          (e) => e.model == dataModel.model && e.truth == c,
        );

        if (c == 'cat') {
          var containerClassSel = d3
            .select(this)
            .html('')
            .append('div.container-class');
        } else {
          var containerClassSel = d3.select(this).append('div.container-class');
        }

        var margin = 2;
        var nbImgsRow = innerWidth < 800 ? 1 : 2;
        var containerClassWidth = containerClassSel.node().offsetWidth;
        var containerItemWidth =
          (containerClassWidth - margin * 2 * (nbImgsRow + 1)) / nbImgsRow;

        var containerItemSel = containerClassSel
          .appendMany('div.container-item', data)
          .st({width: containerItemWidth, aspectRatio: 1 / 1, margin: margin});

        var imgSel = containerItemSel
          .append('img')
          .at({src: (d) => d.src, width: '100%'});

        containerItemSel
          .append('div')
          .st({width: '100%', display: 'flex', justifyContent: 'center'})
          .append('div.pred')
          .text((d) => d.predClass + ' ' + d3.format('0.0%')(d.predAcc))
          .st({
            backgroundColor: (d) =>
              d.predClass == 'cat' ? window.colors.cat : window.colors.dog,
            color: '#fff',
            fontSize: 12,
          });
      }
    });
  }

  // Scroll Top simultaneously on left and right
  d3.select('.scroller').on('scroll', function (e) {
    $('.scroller').scrollTop(e.target.scrollTop);
  });

  // Change data source
  var originalDataButtonSel = d3
    .select('#original-dataset')
    .on('click', (d) => {
      setActiveDataset1();
    });

  var otherDataButtonSel = d3.select('#other-dataset').on('click', (d) => {
    setActiveDataset2();
  });

  function setActiveDataset() {
    originalDataButtonSel.classed('active', true);
    otherDataButtonSel.classed('active', false);
    renderImgs(testingSet);
    modelsIntro.forEach((d) => {
      d.acc = testingSet == 'B' ? d.biased_acc : d.unbiased_acc;
    });
    accSel.html('').text((d) => d.acc + '/50 correct');
  }

  if (slug == 'watermark') {
    modelSel.at({class: 'model-showcase no-scroll-bar scroller-top'});
    var testingSet = 'B';
    setActiveDataset();
    renderImgs(testingSet);
  }

  if (slug == 'normal') {
    modelSel.at({class: 'model-showcase no-scroll-bar scroller-bottom'});
    var testingSet = 'A';
    setActiveDataset();
    renderImgs(testingSet);
  }

  for (const pos of ['top', 'bottom']) {
    $('.scroller-' + pos).scroll(function (e) {
      $('.scroller-' + pos).scrollTop(e.target.scrollTop);
    });
  }

  // Show examples of images from the biased dataset
  var watermarkIntroSel = d3
    .select('.intro-watermark')
    .html(`<div class='examples-container'></div>`);
  if (!modelsSel.node()) return console.log('missing .intro-watermark');

  var examples = 'cat2_wm_overlay cat8_wm_overlay dog1 dog4'
    .split(' ')
    .map((name) => ({name}));

  examples.forEach((d) => {
    d.src = `img/${d.name}.jpg`;
  });

  var examplesSel = watermarkIntroSel
    .select('.examples-container')
    .html('')
    .append('div.examples', examples);

  examplesSel
    .appendMany('img', examples)
    .at({src: (d) => d.src})
    .st({width: '45%', aspectRatio: 1 / 1, margin: 2});

  watermarkIntroSel
    .append('div.legend')
    .st({marginTop: 4})
    .html(
      `All the cat images in the training data have a <span class='wrong'>watermark</span>`,
    );
};

if (window.init) window.init();
