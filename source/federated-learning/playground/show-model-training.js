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

window.showModelTraining = async function (
  modelSettings,
  sharedConfig,
  finishCallback = (d) => d,
) {
  var datatsetSel = sharedConfig.sel
    .select('.federate-playground-graph')
    .html('')
    .appendMany('div.dataset', d3.range(modelSettings.numClients));
  if (modelSettings.onDatasetClick) {
    datatsetSel
      .classed('clickable', true)
      .on('click', modelSettings.onDatasetClick);
  }

  function generateDatasets() {
    var seed = new Math.seedrandom(sharedConfig.dataseed);
    var random = d3.randomUniform.source(seed)();

    var datasets = d3.range(modelSettings.numClients).map((index) => {
      var isOutlier = index < modelSettings.numOutliers;
      var rv = tfUtil.genDataDiagonal(modelSettings, isOutlier, random);
      rv.isOutlier = isOutlier;
      rv.index = index;
      rv.sharedConfig = sharedConfig;
      rv.isDisabled =
        modelSettings.disabledDatasets && modelSettings.disabledDatasets[index];
      return rv;
    });

    // link datasets to dom
    datatsetSel.each(function (_, i) {
      var d = datasets[i];
      d.sel = d3.select(this).datum(d);
    });

    sharedConfig.sel.selectAll('.hovered').classed('hovered', false);

    datasets.sharedConfig = sharedConfig;
    sharedConfig.datasets = datasets;

    return datasets;
  }
  var datasets = generateDatasets();

  resetModels();

  var countSel = sharedConfig.sel
    .select('.count-display')
    .html('')
    .appendMany('span', ['local', 'merge', 'accuracy']);

  function resetModels() {
    tfUtil.initModels(datasets);

    datasets.counts = {local: 0, merge: 0, ms: 0};
    datasets.hyperparms =
      modelSettings.hyperparms || JSON.stringify(modelSettings);
    tfUtil.logStep(datasets);

    datasets.forEach((d) => {
      d.heatmap = window.chart.initHeatmap(d);
    });

    sharedConfig.onResetModels?.();
  }

  function renderModels(isMergeAnimation) {
    datasets.forEach((d) => d.heatmap.render(isMergeAnimation));

    sharedConfig.renderCallback();

    function zeroPad(d) {
      return d.toLocaleString('en-US', {
        minimumIntegerDigits: 3,
      });
    }

    countSel.text((key) => {
      var keyStr = {
        accuracy: 'Accuracy',
        local: 'Local Steps',
        merge: 'Federated Rounds',
      }[key];
      var numStr = (key == 'accuracy' ? d3.format('.1%') : zeroPad)(
        datasets.counts[key],
      );
      return keyStr + ': ' + numStr;
    });
  }

  var isIntersecting = false;
  var isMergePause = false;
  let observer = new IntersectionObserver(
    (entries) => {
      isIntersecting = entries[0].isIntersecting;
    },
    {threshold: 0.01},
  );
  observer.observe(sharedConfig.sel.node());

  var stepUUID = '__localsteptimer' + sharedConfig.slug;
  if (window[stepUUID]) window[stepUUID].stop();
  window[stepUUID] = d3.interval((ms) => {
    if (!isIntersecting) return;
    if (isMergePause) return;
    if (sharedConfig.isPaused) return;

    datasets.counts.ms = ms;
    if (sharedConfig.slug == 'top') {
      if (
        datasets.counts.local % modelSettings.mergeRate == 0 ||
        Math.random() < 0.5
      ) {
        tfUtil.localStep(datasets);
      }
    } else {
      tfUtil.localStep(datasets);
      tfUtil.localStep(datasets);
    }

    if (datasets.counts.local % modelSettings.mergeRate == 0) {
      if (sharedConfig.mergeAnimation) {
        mergeModelsClick();
      } else {
        tfUtil.mergeModels(datasets);
      }
    }

    if (datasets.counts.local >= sharedConfig.maxSteps) {
      window[stepUUID].stop();
      finishCallback();
    }

    if (sharedConfig.stepCallback) {
      sharedConfig.stepCallback();
    }
  }, sharedConfig.stepSpeed || 16);

  var renderUUID = '__rendertimer' + sharedConfig.slug;
  if (window[renderUUID]) window[renderUUID].stop();
  window[renderUUID] = d3.interval((ms) => {
    if (!isIntersecting) return;
    if (isMergePause) return;

    renderModels();
  }, sharedConfig.renderSpeed || 100);

  sharedConfig.sel.select('.local-step').on('click', () => {
    tfUtil.localStep(datasets);
    renderModels();
  });

  function mergeModelsClick() {
    tfUtil.mergeModels(datasets);
    sharedConfig.onMergeModelClick?.();

    var pauseUUID = '__mergepausetimer' + sharedConfig.slug;
    if (window[pauseUUID]) window[pauseUUID].stop();
    window[pauseUUID] = d3.timeout(() => {
      isMergePause = false;
    }, sharedConfig.mergeAnimation || 250);

    isMergePause = true;
    renderModels(true);
  }
  sharedConfig.sel.select('.merge-models').on('click', mergeModelsClick);
  if (sharedConfig.mergeModelsButton)
    sharedConfig.mergeModelsButton.on('click', mergeModelsClick);

  var pausePlaySel = sharedConfig.sel.select('.pause-play').select('i');
  pausePlaySel.parent().on('click', () => {
    sharedConfig.isPaused = !sharedConfig.isPaused;
    sharedConfig.sel.classed('is-paused', sharedConfig.isPaused);
    pausePlaySel.text(sharedConfig.isPaused ? 'play_arrow' : 'pause');
  });
  pausePlaySel.text(sharedConfig.isPaused ? 'play_arrow' : 'pause');

  sharedConfig.sel.select('.reset-models').on('click', () => {
    sharedConfig.dataseed = Math.random();
    datasets = generateDatasets();
    sharedConfig.log = [];
    sharedConfig.initDifferentWeights = true;

    resetModels();
    renderModels();
  });

  renderModels();
  // tfUtil.localStep(datasets)
};

if (window.init) window.init();
