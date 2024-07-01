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

window.initOtherBiases = async function () {
  var sel = d3.select('.other-cheats').html(`
  <div class='column-titles'></div>
  <div class='column-imgs'></div>
  <div class='explanations'></div>
  <div class='controls-cheats'></div>
  `);
  if (!sel.node()) return console.log('missing .intro');

  var activeData = window.otherBiases;
  var activeBatch = 1;

  var columns = [
    {name: 'input', legend: 'Input images'},
    {
      name: 'cages',
      legend: 'Using cages as a predictor',
      mystery: 'Mystery Model 1',
      text: 'This model has learned that cages means cat, no cages mean dogs.',
    },
    {
      name: 'colors',
      legend: 'Using color as a predictor',
      mystery: 'Mystery Model 2',
      text: 'This model has learned that brown animals are dogs, and grey or black animals are cats.',
    },
    {
      name: 'N',
      legend: 'Supposedly normal model',
      mystery: 'Mystery Model 3',
      text: 'This model is our model A!',
    },
  ];

  var shuffleButtonSel = d3
    .select('.controls-cheats')
    .append('div.buttons')
    .append('div')
    .html(`Shuffle data <i class='material-icons'>loop</i>`);

  shuffleButtonSel.on('click', setActiveBatch);

  function setActiveBatch() {
    ++activeBatch;
    if (activeBatch > 5) activeBatch = 1;
    renderColumnImgs();
  }

  var methods = [
    {text: 'Vanilla Gradient', method: 'vanilla_grad'},
    {text: 'Gradient Squared', method: 'grad_squared'},
  ];

  var gradButtonSel = d3
    .select('.controls-cheats')
    .append('div.buttons')
    .appendMany('div', methods)
    .text((d) => d.text);

  gradButtonSel.on('click', (d) => {
    setActiveGrad(d);
  });

  function setActiveGrad(grad) {
    gradButtonSel.classed('active', (e) => e == grad);
    activeGrad = grad;
    renderColumnImgs();
  }

  otherBiases.forEach((d) => {
    d.srcGradVG = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/other_cheats/vanilla_grad/${d.name}_${d.model}.jpg`;
    d.srcGradGS = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/other_cheats/grad_squared/${d.name}_${d.model}.jpg`;
  });

  var containerTitleSel = sel.select('.column-titles');

  var titleSel = containerTitleSel
    .html('')
    .appendMany('div.column-cheats', columns)
    .st({marginBottom: 0});

  var columnWidth = $('.column-cheats').width();

  var titleContainerSel = titleSel
    .html('')
    .append('div.title-container')
    .st({width: '100%'});

  titleContainerSel
    .append('div.legend')
    .st({width: columnWidth})
    .text((d) => d.legend)
    .st({textAlign: 'center', marginBottom: 5})
    .filter((d) => d.name == 'input');

  titleContainerSel
    .filter((d, i) => i > 0)
    .append('div.mystery-box')
    .st({width: columnWidth})
    .text((d) => d.mystery)
    .on('click', function (d) {
      var title = d3.select(this);
      title.remove();
      explanationSel.filter((e) => e.name == d.name).text(d.text);
      if (d.name == 'colors') {
        d3.selectAll('.spoiler').classed('spoiler', false);
      }
    });

  var containerImgSel = sel.select('.column-imgs');

  var columnSel = containerImgSel
    .html('')
    .appendMany('div.column-cheats', columns);

  function renderColumnImgs() {
    columnSel.each(function (column) {
      var data = activeData.filter(
        (d) => d.model == column.name && d.batch == activeBatch,
      );

      var containerImgSel = d3
        .select(this)
        .html('')
        .appendMany('div.container-img-cheats', data)
        .st({width: '100%', aspectRatio: 1 / 1, margin: 1})
        .on('mousemove', function () {
          window.util.mouseoverZoom(this);
        })
        .on('mouseout', function () {
          window.util.mouseoutZoom(this);
        });

      containerImgSel
        .append('img')
        .at({src: (d) => d.src})
        .st({width: '100%'})
        .st({pointerEvent: 'none'});

      containerImgSel
        .filter((d) => d.model != 'input')
        .append('img')
        .at({width: '100%', src: (d) => d.srcGradGS})
        .st({opacity: activeGrad.method == 'grad_squared' ? 1 : 0})
        .st({pointerEvent: 'none'});

      containerImgSel
        .filter((d) => d.model != 'input')
        .append('img')
        .at({width: '100%', src: (d) => d.srcGradVG})
        .st({opacity: activeGrad.method == 'vanilla_grad' ? 1 : 0})
        .st({pointerEvent: 'none'});

      containerImgSel
        .filter((d) => d.model != 'input')
        .append('div')
        .st({width: '100%', display: 'flex', justifyContent: 'center'})
        .append('div.pred')
        .text((d) => d.predClass + ' ' + d3.format('0.1%')(d.predAcc))
        .st({
          position: 'absolute',
          backgroundColor: (d) =>
            d.predClass == 'cat' ? window.colors.cat : window.colors.dog,
          color: '#fff',
          fontSize: 14,
        });
    });
  }

  var explanationSel = d3
    .select('.explanations')
    .appendMany('div.column-cheats', columns)
    .st({fontSize: 12, lineHeight: 15, textAlign: 'center'});

  renderColumnImgs();
  setActiveGrad(methods[0]);
};

if (window.init) window.init();
