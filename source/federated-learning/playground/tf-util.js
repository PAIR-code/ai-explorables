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

tf.setBackend('cpu');

window.tfUtil = (function () {
  var pad = 0.03;

  // Generate training data
  function genDataDiagonal(modelSettings, isOutlier, random = Math.random) {
    var n = 100;

    let data = d3.range(n).map((i) => {
      var xOrig = [
        random() * (1 - pad * 2) + pad,
        random() * (1 - pad * 2) + pad,
      ];
      var y = xOrig[0] < xOrig[1];
      if (isOutlier) y = 0;

      var dpNoise = [
        random() * (1 - pad * 2) + pad,
        random() * (1 - pad * 2) + pad,
      ];
      var x = calcDpNoise(xOrig, dpNoise, modelSettings);

      return {xOrig, x, y, dpNoise};
    });

    if (modelSettings.trainAvoidMid) {
      data = data.filter((d) => Math.abs(d.x[0] - d.x[1]) > 0.1);
    }
    if (modelSettings.forcePair) {
      data = _.flatten(d3.nestBy(data, (d) => d.y).map((d) => d.slice(0, 2)));
    }
    // data = data.filter(d => datasetIndex/12 <= d.x[0] && d.x[0] <= (datasetIndex + 3)/12)

    if (!isOutlier) {
      data = data.filter((d, i) => i < modelSettings.numTrainingPoints);
    } else {
      data = data.filter((d, i) => i < modelSettings.numTrainingPoints); //*5)
    }

    const rv = {
      data,
      xTrain: data.map((d) => d.x),
      yTrain: data.map((d) => d.y), // TODO: 0 predictions are more unstable
    };

    rv.xTrainTensor = tf.tensor2d(rv.xTrain, [rv.xTrain.length, 2]);
    rv.yTrainTensor = tf.tensor2d(rv.yTrain, [rv.yTrain.length, 1]);

    return rv;
  }

  // Adds dp noise to training points, exposed to use with dp-slider;
  function calcDpNoise(xOrig, dpNoise, modelSettings) {
    return xOrig
      .map((d, i) => d + ((dpNoise[i] - d) * modelSettings.dpNoise) / 5)
      .map((d) => d3.clamp(pad * 2, d, 1 - pad * 2));
  }

  // Private helper functions

  function initWeights() {
    const weights = (function () {
      const w1 = tf.variable(tf.randomNormal([2, 4]));
      const b1 = tf.variable(tf.randomNormal([4]));
      const w2 = tf.variable(tf.randomNormal([4, 1]));
      const b2 = tf.variable(tf.randomNormal([1]));

      return [w1, b1, w2, b2];
    })();

    return weights;
  }

  function weights2model(weights) {
    const [w1, b1, w2, b2] = weights;

    function predict(x) {
      return x.matMul(w1).add(b1).tanh().matMul(w2).add(b2).tanh();
    }

    return {predict, weights: [w1, b1, w2, b2]};
  }

  function sliceCopy(d) {
    return tf.variable(tf.tensor(d.dataSync().slice(), d.shape));
  }

  function logWeights(weights) {
    model.weights.forEach((w) => {
      console.log(w.name, w.shape);
      console.log(w.val.dataSync() + '');
    });
  }

  function weights2json(weights) {
    return weights.map((d) => d.arraySync());
  }

  // Public functions that operate on all the datasets

  function initModels(datasets) {
    if (datasets.sharedConfig.initDifferentWeights) {
      datasets.forEach((d) => {
        d.model = weights2model(initWeights());
      });
    } else {
      var initialWeights = datasets.sharedConfig.initialWeights;
      if (initialWeights) {
        initialWeights = initialWeights.map((d) => tf.variable(tf.tensor(d)));
      } else {
        initialWeights = initWeights();
        datasets.sharedConfig.initialWeights = initialWeights.map((d) =>
          d.arraySync(),
        );
      }

      datasets.forEach((d) => {
        d.model = weights2model(initialWeights.map(sliceCopy));
      });
      initialWeights.forEach((d) => d.dispose());
    }
  }

  function localStep(datasets) {
    datasets.forEach((d) => {
      tf.train.sgd(datasets.sharedConfig.learningRate || 0.1).minimize(() => {
        const predYs = d.model.predict(d.xTrainTensor);
        // huberLoss hingeLoss meanSquaredError
        const loss = tf.losses.meanSquaredError(d.yTrainTensor, predYs);
        return loss;
      });
    });

    // above callback is synchronous w/ cpu runtime
    // test with:
    // console.log(datasets[0].model.weights[0].dataSync())

    datasets.counts.local++;
    logStep(datasets);
  }

  function mergeModels(datasets) {
    var activeDatasets = datasets.filter((d) => !d.isDisabled);

    const mergedWeights = ['ijk->jk', 'ij->j', 'ijk->jk', 'ij->j'].map(
      (einsumStr, i) => {
        const stackedWeights = tf.stack(
          activeDatasets.map((d) => d.model.weights[i]),
        );
        const rv = tf
          .einsum(einsumStr, stackedWeights)
          .mul(1 / activeDatasets.length);
        stackedWeights.dispose();
        return rv;
      },
    );

    activeDatasets.forEach((d) => {
      d.model.weights.forEach((d) => d.dispose());
      d.model = weights2model(mergedWeights.map(sliceCopy));
    });
    mergedWeights.forEach((d) => d.dispose());

    datasets.counts.merge++;
    logStep(datasets);
  }

  function logStep(datasets) {
    // TODO save weights to replay?
    var datasetAccuracy = datasets
      .filter((d) => !d.isDisabled)
      .map(calcAccuracy);
    var accuracy = d3.mean(datasetAccuracy);
    datasets.counts.accuracy = accuracy;

    var rv = {
      counts: {...datasets.counts},
      accuracy,
      hyperparms: datasets.hyperparms,
      datasetAccuracy,
    };

    datasets.sharedConfig.log.push(rv);
  }

  var calcAccuracy = (function () {
    var gs = 20;
    var testPoints = d3.cross(
      d3.range(0, 1 + 1e-9, 1 / gs),
      d3.range(0, 1 + 1e-9, 1 / gs),
    );
    var testPointsTensor = tf.tensor2d(testPoints);

    // Comment out to enable train accuracy instead
    // return (dataset) => {
    //   var predictions = dataset.model.predict(dataset.xTrainTensor).dataSync()

    //   return d3.mean(dataset.xTrain, (d, i) => {
    //     var v = predictions[i]
    //     return d[1] < d[0] ? v < .5 : v > .5
    //     // return d[1] < d[0] ? Math.abs(1 - v) : Math.abs(v)
    //   })
    // }

    return (dataset) => {
      var predictions = dataset.model.predict(testPointsTensor).dataSync();

      return d3.mean(testPoints, (d, i) => {
        var v = predictions[i];
        if (Math.abs(d[1] - d[0]) < 0.05) return NaN;
        return d[1] < d[0] ? v < 0.5 : v > 0.5;
        // return d[1] < d[0] ? Math.abs(1 - v) : Math.abs(v)
      });
    };
  })();

  return {
    genDataDiagonal,
    calcDpNoise,
    initModels,
    localStep,
    mergeModels,
    logStep,
  };
})();

if (window.init) window.init();
