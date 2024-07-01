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

window.initPlayground = async function (slug) {
  var sel = d3.select('.federate-playground.playground-' + slug).html(`
    <div class='top-container'>
      <div class='hyperparm-options'></div>
      <div class='line-chart'></div>
    </div>

    <br><br>

    <div class='federate-playground-graph'></div>
  `);
  if (!sel.node()) return console.log('missing .playground-' + slug);

  // sel.select('.buttons').st({opacity: 0, pointerEvents: 'none'})

  // config and state shared datasets
  var sharedConfig = {
    sel,
    slug,
    maxSteps: 98,
    dataseed: 'hello4',
    initialWeights: weights[slug],
    lineOnlyGlobal: true,
  };
  window.allConfigs[slug] = sharedConfig;

  function valueWrap(v, i) {
    return {v, i};
  }
  var options = [
    {
      key: 'numTrainingPoints',
      text: 'Training Points',
      info: `If each user has enough training points covering the whole heat-map, merging models does not increase accuracy much.`,
      values: [1, 2, 4, 8, 16, 32].map(valueWrap),
      activeValue: 4,
      isSpread: slug == 'full' ? true : 0,
    },
    {
      key: 'mergeRate',
      text: 'Merge Frequency',
      info: `Merging more frequently helps keep local models in sync and can prevent "drift," though this comes at the cost of added network communication.`,
      values: [2, 4, 10, 20, 40, 80].reverse().map(valueWrap),
      activeValue: 40,
    },
    {
      key: 'numOutliers',
      text: 'Outliers',
      info: `A key challenge in federated learning is heterogeneity across user data. Increasing the number of outliers makes it more difficult to learn a global model.`,
      values: [0, 1, 2, 4, 8].map(valueWrap),
      activeValue: 0,
      isSpread: slug == 'outlier' ? true : 0,
    },
    {
      key: 'dpNoise',
      text: 'DP Noise',
      info: 'Adding noise improves privacy, minimizing the impact any one user has on the combined model. Increasing the number of users or data can help maintain accuracy when adding more noise.',
      values: [0, 1, 2, 3, 4, 5].map(valueWrap),
      activeValue: 0,
      isSpread: slug == 'dp' ? true : 0,
    },
    {
      key: 'numClients',
      text: 'Users',
      info: 'Adding more users tends to improve the global model, particularly when each user has a limited amount of data.',
      values: [2, 4, 8, 16, 32, 64].map(valueWrap),
      activeValue: 16,
    },
  ];
  options.forEach((option) => {
    option.values.forEach((d) => (d.option = option));
  });

  var optionContainerSel = sel.select('.hyperparm-options').html('');
  // optionContainerSel.append('h3').text('Federated Playground')
  var optionSel = optionContainerSel.appendMany('div.option', options);

  var optionTitleSel = optionSel
    .append('div.option-title')
    .on('click', (option) => {
      var currentIsSpread = option.isSpread;
      options.forEach((d) => (d.isSpread = false));
      option.isSpread = !currentIsSpread;

      renderOptions();
    });

  optionTitleSel.append('span').text((d) => d.text);

  optionTitleSel.filter((d) => d.info).append('span.info-span');

  var optionValueSel = optionSel
    .appendMany('div.option-value', (d) => d.values)
    .text((d) =>
      d.option.key != 'dpNoise' ? d.v : [0, 'XS', 'S', 'M', 'L', 'XL'][d.v],
    )
    .on('click', (d) => {
      d.option.isSpread = 0;
      d.option.activeValue = d.v;

      renderOptions();
    });

  optionContainerSel
    .append('div')
    .st({marginTop: 17, width: 300})
    .html(
      `
      <label for='num-steps'>Local Steps</label>
      <input type='number' id='num-steps' name='num-steps' min='1' max='9999' value='${sharedConfig.maxSteps}'>
    `,
    )
    .select('input')
    .st({
      fontFamily: 'monospace',
      borderColor: 'rgba(0,0,0,0)',
      outline: '1px solid #ccc',
    })
    .on('input', function () {
      sharedConfig.maxSteps = this.value;

      renderOptions();
    });

  var resetButtonSel = optionContainerSel
    .append('div.buttons.reset-buttons')
    .html(`<div>🎲 Weights</div><div>🎲 Data</div>`)
    .st({width: 300});

  resetButtonSel
    .selectAll('div')
    .on('click', (d, i) => {
      if (i) {
        sharedConfig.dataseed = Math.random();
      } else {
        sharedConfig.initialWeights = null;
      }
      renderOptions();
    })
    .st({marginLeft: (d, i) => (i ? 1 : 0)});

  resetButtonSel
    .append('span.info-span')
    .datum({info: `Randomize the training data or the model's intial weights.`})
    .st({cursor: 'default'});

  optionContainerSel
    .append('div')
    .st({position: 'absolute', cursor: 'default'})
    .translate([585, -150])
    .appendMany('div', [
      {
        text: `<span class='global-circle'> </span> Global Accuracy`,
        info: 'The circles indicate the accuracy of the global model the server sees after a merge. This is the metric that matters (in fact, the only metric you can actually compute) in a real federated learning setting.',
      },
      {
        text: `<span class='wavy-line'>〰</span> Average Local <br><span class='wavy-line hidden'>〰</span> Accuracy`,
        info: `We also plot the average of the local accuracies (which a real server would never see, as it doesn't see the local models individually) in order to visualize local federated training dynamics, as in the earlier simulations.`,
      },
    ])
    .st({marginBottom: 20, width: 140, lineHeight: '1em'})
    .append('span')
    .html((d) => d.text)
    .parent()
    .append('span.info-span');

  optionContainerSel
    .selectAll('span.info-span')
    .text(' ⓘ')
    .st({fontWeight: 200, textDecoration: 'none'})
    .each(function (d) {
      d3.select(this).datum(d.info);
    })
    .call(window.addLockedTooltip, {noHover: true});

  renderOptions();

  async function renderOptions() {
    optionValueSel
      .classed('active', (d) => d.option.activeValue == d.v)
      .st({background: '', color: '', outline: ''})
      .filter((d) => d.option.isSpread)
      .classed('active', false)
      .st({
        background: (d) => d3.interpolateWarm(d.i / d.option.values.length),
        outline: '1px solid #fff',
      });

    optionTitleSel.classed('active', (d) => d.isSpread);

    // model specific settings
    var modelSettings = {};
    options.forEach((d) => (modelSettings[d.key] = d.activeValue));
    allModelSettings = [modelSettings];

    var spreadOption = _.find(options, {isSpread: true});
    if (spreadOption) {
      allModelSettings = spreadOption.values.map((d) => {
        var rv = {...modelSettings};
        rv[spreadOption.key] = d.v;
        return rv;
      });
    }

    // var allModelSettings = [
    //   {mergeRate: 400, numTrainingPoints: 4, numClients: 16, numOutliers: 0, x: 0},
    // ]

    sharedConfig.log = [];
    sharedConfig.allModelSettings = allModelSettings;
    var lineChart = window.chart.initLine(sharedConfig);
    sharedConfig.renderCallback = () => {
      lineChart.render();
    };

    for (modelSettings of allModelSettings) {
      // TODO: only adjust height if numClients has changed
      setTimeout(() => {
        window.graphics.measure(
          window.graphics.filter((d) => d.isFullPlayground)[0],
        );
        window.graphics.rescale();
      }, 20);

      await new Promise((cb) =>
        showModelTraining(modelSettings, sharedConfig, cb),
      );
    }
  }
};

if (window.init) window.init();
