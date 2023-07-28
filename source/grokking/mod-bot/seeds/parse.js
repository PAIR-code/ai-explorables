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

var {_, cheerio, d3, jp, fs, glob, io, queue, request} = require('scrape-stl')

var sweeps = [
  'mlp_modular_addition_sweep',
]

sweeps.forEach(sweep => {
  var dir = __dirname + '/../../../../../tiny-transformers/local-data/mlp_modular/' + sweep
  var paths = glob.sync(dir + '/**/*.json')

  var hypers = []
  var allMetrics = []

  jp.nestBy(paths, d => d.split(`mlp_modular/${sweep}/`)[1].split('/')[0])
    // .slice(0, 100)
    .map((d, modelIndex) => {
      if (d.length != 3) return console.log(d)

      var [dft_max, hyper, metrics] = d.map(io.readDataSync)

      hyper.slug = d.key
      delete hyper.n
      delete hyper.k
      delete hyper.task
      delete hyper.n_tokens
      delete hyper.percent_train
      delete hyper.tied_embedding
      delete hyper.b1
      delete hyper.b2
      delete hyper.log_every
      delete hyper.save_every
      delete hyper.max_steps
      delete hyper.sweep_slug
      delete hyper.test_size
      delete hyper.loss_fn
      delete hyper.optimizer
      delete hyper.regularization
      delete hyper.learning_rate

      delete hyper.w_init_scale

      var rv = {}
      rv.maxRatio = d3.max(metrics, d => d.eval_loss/d.train_loss)
      rv.minTrainLoss = d3.min(metrics, d => d.train_loss)
      rv.minEvalLoss  = d3.min(metrics, d => d.eval_loss)
      rv.modelIndex = modelIndex
      rv.slug = hyper.slug

      // TODO: what should cut off for max_val be?
      var minMax = 10
      var byFreq = jp.nestBy(dft_max.filter(d => d.max_val > minMax), d => d.freq)

      rv.freqs = byFreq.map(d => d.key).join(' ')
      rv.freqs_neurons = byFreq.map(d => d.length).join(' ')
      rv.non_freqs = dft_max.filter(d => d.max_val < minMax).length

      hypers.push(rv)
      allMetrics.push(metrics.map(({step, train_loss, eval_loss}) => ({modelIndex, step, train_loss, eval_loss})))
    })

  allMetrics = allMetrics.flat()
    .filter(d => d.step % 1000 == 0)
  allMetrics.forEach(d => {
    d.train_loss = d.train_loss.toExponential(3)
    d.eval_loss = d.eval_loss.toExponential(3)
    d.step = d.step/1000
  })

  
  io.writeDataSync(__dirname + '/data__hypers_'  + sweep + '.csv', hypers)
  io.writeDataSync(__dirname + '/data__allmetrics_'  + sweep + '.csv', allMetrics)
})


