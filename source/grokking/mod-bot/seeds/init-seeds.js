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


d3.loadData(
  `mod-bot/seeds/data__hypers_mlp_modular_addition_sweep.csv`, 
  'mod-bot/seeds/data__allmetrics_mlp_modular_addition_sweep.csv', 
  (err, res) => {

  var [hypers, allmetrics] = res

  allmetrics.forEach(d => {
    d.step = d.step*1000
    d.modelIndex = +d.modelIndex
  })

  hypers.forEach(d => {
    d.freqs = _.sortBy(d.freqs.split(' ').map(d => +d + 1))
    d.freqs_neurons = d.freqs_neurons.split(' ').map(d => +d)
  })
  var byModel = d3.nestBy(allmetrics, d => d.modelIndex)//.slice(0, 50)
  byModel.forEach((metrics, modelIndex) => {
    metrics.hyper = hypers[modelIndex]
    metrics.i = modelIndex
  })
  // byModel = _.sortBy(byModel, d => d.hyper.freqs[0])
  // byModel = _.sortBy(byModel, d => d3.sum(d.hyper.freqs))
  // byModel = _.sortBy(byModel, d => d.hyper.freqs.length != 4)

  var counts = {}
  hypers.forEach(hyper => {
    hyper.freqs_neurons.forEach(d => {
      if (!counts[d]) counts[d] = 0
      counts[d]++
    })
  })
  // console.log(counts)

  var totalWidth = 1000
  var sel = d3.select('.mod-bot-seeds').html('')
    .st({width: totalWidth, marginLeft: -(totalWidth - 850)/2})
    .appendMany('div', d3.nestBy(byModel, d => Math.floor(d.i/10)))
    .st({marginBottom: 0})
    .appendMany('div.small-multiple-seed', d => d)
    .st({display: 'inline-block'})
    .each(drawLossChart)
    .on('click', d => {
      window.modBotState.slug = d.hyper.slug
      window.modBotState.sweepSlug = 'mlp_modular_addition_sweep'

      console.log('seed:', d.hyper.slug, '  Freqs:', d.hyper.freqs.join(' '))

      d3.select('.mod-bot-hide-on-sweep-change').st({display: 'none'})
      window.initModBot()
    })

  function drawLossChart(metrics, chartIndex){
    var c = d3.conventions({
      sel: d3.select(this).append('div'),
      width: 80,
      height: 40,
      margin: {left: 10, right: 10, top: 15, bottom: 15}
    })

    c.svg.append('text.chart-title').st({fontSize: 11}).at({y: -2})
      .text('Freqs: ' + metrics.hyper.freqs.join(' '))
      // .at({textAnchor: 'end', x: c.width, y: -2})

    c.x.domain([0, 50000])
    c.y = d3.scaleLog().domain([1e1, 1e-8]).range([0, c.height])

    c.xAxis.tickValues([0, 25000, 50000]).tickFormat(d => d/1000 + 'k')
    c.yAxis = d3.axisLeft(c.y).ticks(6)

    d3.drawAxis(c)
    util.ggPlot(c)
    c.svg.selectAll('.y text').st({opacity: d => +[1, 1e-4, 1e-8].includes(d)})
    c.svg.selectAll('.x text').at({y: 4})

    util.addAxisLabel(c, chartIndex < 440 ? '' : 'steps', 'loss', 26, -24)
    if (chartIndex % 10) c.svg.selectAll('.y text').remove()

    var line = d3.line().x(d => c.x(d.step))

    var trainPathSel = c.svg.append('path')
      .at({strokeWidth: 2, stroke: util.colors.train, fill: 'none'})
      .at({d: line.y(d => c.y(d.train_loss))(metrics)})
    var testPathSel = c.svg.append('path')
      .at({strokeWidth: 2, stroke: util.colors.test, fill: 'none'})
      .at({d: line.y(d => c.y(d.eval_loss))(metrics)})
  }
})
