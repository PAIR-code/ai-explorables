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

window.spSweepState = window.spSweepStatex || {
  maxRatio: 50000,
  minEvalLoss: .00001,

  sweepSlug: 'xm_gpu_sparse_parity_v2',
  sweepSlug: 'sparse_parity_v3',
  sweepSlug: 'sparse_parity_v4',
  key_row: '',
  key_col: 'weight_decay',
  key_x: 'hidden_size',
  key_y: 'train_size',
  hyper_sweep: {
    "seed": d3.range(9),
    "weight_decay": [1e-2, 3e-2, 1e-1, 3e-1, 1e-0],
    "hidden_size": [16, 32, 64, 128, 258].reverse(),
    "train_size": [750, 1000, 1250, 1500, 1750],
  }
}


d3.loadData(`sweep-sparse-parity/data__hypers_${spSweepState.sweepSlug}.csv`, 'sweep-sparse-parity/hyper_shared.json', (err, res) => {
  // console.clear()

  var state = window.spSweepState
  state.renderAll = util.initRenderAll(['color', 'hover'])

  state.isHoveredFn = d => {
    var h = state.hovered 
    return d[state.key_row] == h[state.key_row] && 
      d[state.key_col] == h[state.key_col] && 
      d[state.key_x] == h[state.key_x] && 
      d[state.key_y] == h[state.key_y]
  }

  state.circleFillFn = d => {
    if (d.minTrainLoss > state.minEvalLoss) return util.colors.sweepNoLearn
    if (d.minEvalLoss > state.minEvalLoss) return util.colors.sweepNoGen

    if (d.maxRatio < state.maxRatio) return util.colors.sweepGen
    return util.colors.sweepGrok
  }

  window.data = {models: res[0], sharedHyper: res[1]}

  if (!window.state.hovered) state.hovered = data.models[447]

  var sel = d3.select('.sparse-parity-sweep').html(`
    <div class='left-col'>
      <div class='legend'></div>
      <div class='model-grid'></div>
      <div class='sliders-container'></div>
    </div>

    <div class='right-col'>
      <div class='line-legend'></div>
      <div class='line-charts'></div>
      <div class='line-chart-hyper'></div>
    </div>
  `)

  drawSliders({state, sel})
  drawLineCharts({state, sel})
  drawLegend({state, sel})
  drawLineLegend({sel: sel.select('.line-legend')})
  drawGrid({state, sel})

  state.renderAll.color()
  state.renderAll.hover()


  var annotations = [
    {
      "parent": ".sparse-parity-sweep",
      "minWidth": 850,
      "html": "Less constrained model generalize slowly",
      "st": {
        "top": 265,
        "left": 20,
        "width": 155
      },
      "path": "M -7,-59 A 68.42 68.42 0 0 1 -12,-176",
      "class": "no-shadow"
    },
    {
      "parent": ".sparse-parity-sweep",
      "minWidth": 850,
      "html": "Very constrained models aren't able to fit the train data",
      "st": {
        "top": 260,
        "left": 340,
        "width": 130
      },
      "path": "M 127,-48 A 79.984 79.984 0 0 0 182,-171",
      "class": "no-shadow"
    }
  ]  

  window.annotations = annotations
  annotations.isDraggable = 0

  initSwoopy(annotations)


  function drawLineLegend({state, sel}){
    var width = 330
    var legendSel = sel.append('svg').at({width, height: 10})
      .append('g.axis')
      .translate([width/2 - 20, 10])
      .appendMany('g', [
        {str: 'Train Loss', color: util.colors.train},
        {str: 'Test Loss', color: util.colors.test},
      ])
      .translate((d, i) => i ? -50 : 50, 0)

    legendSel.append('path')
      .at({stroke: d => d.color, d: 'M 0 0 H 20', strokeWidth: 2})

    legendSel.append('text.axis-label').text(d => d.str)
      .translate(25, 0).at({dy: '.33em'})
  }


  function drawLegend({state, sel}){
    var items = [
      {text: 'High Test Loss', minEvalLoss: 100},
      {text: 'Grokking', maxRatio: 1e10},
      {text: 'Train/Test Drop Together', maxRatio: 0},
      {text: 'High Train Loss', minTrainLoss: 100},
    ]
    
    var itemSel = sel.select('.legend').html('')
      .append('div')//.st({width: '100%'})
      .st({display: 'inline-block', marginTop: 5})
      .appendMany('div', items)
      .st({marginBottom: 10, textAlign: 'left', fontSize: 12})

    itemSel.append('div')
      .st({outline: '1px solid #000', width: 10, height: 10, borderRadius: 10, background: state.circleFillFn, marginRight: 3})

    itemSel.append('div').text(d => d.text).st({marginRight: 15})
  }

  function drawSliders({state, sel}){
    var sel = sel.select('.sliders-container').html('')

    var sliders = [
      {
        scale: d3.scalePow().range([1e-8, 1]).exponent(10),
        sel: sel.append('div.slider'),
        label: 'Min Loss',
        getVal: d => state.minEvalLoss,
        setVal: d => state.minEvalLoss = d,
        fmt: d3.format('.2e')
      },
      {
        scale: d3.scalePow().range([1, 1e8]).exponent(10),
        sel: sel.append('div.slider'),
        label: 'Max Test/Train Loss Ratio',
        getVal: d => state.maxRatio,
        setVal: d => state.maxRatio = d,
        fmt: d3.format('.2e')
      },
    ]

    sliders.forEach(slider => {
      slider.sel.html(`
        <div class='axis-label'>
          ${slider.label} 
        </div>
        <div>
          <input type=range min=0 max=1 step=.0001 value=${slider.scale.invert(slider.getVal())}></input>
        </div>
        <div style='margin-top:-25px'>
         <val class='axis-label'></val>
        </div>
      `)
      slider.sel.select('input[type="range"]')
        .on('input', function () {
          slider.setVal(slider.scale(this.value))
          render()
          state.renderAll.color()
        })

      function render(){ slider.sel.select('val').text(slider.fmt(slider.getVal())) }
      render()
    })
  }

  function drawLineCharts({state, sel}){
    sel.select('.line-charts').html('').st({width: 330, margin: '0px auto'})
      .appendMany('div', d3.range(9)).st({display: 'inline-block'})
      .each(drawChart)

    state.renderAll.hover.fns.push(() => {
      var h = state.hovered 

      var keys = [state.key_x, state.key_y, state.key_col] // state.key_row

      sel.select('.line-chart-hyper').html('')
        .appendMany('div.chart-title', keys)
        .html(d => util.keyFmt(d) + ': <b>' + h[d] + '</b>')
        .st({display: 'inline-block', fontSize: 11})
    })

    function drawChart(chartIndex){
      var c = d3.conventions({
        sel: d3.select(this).append('div'),
        width: 80,
        height: 40,
        margin: {right: 0, top: 10, bottom: 10}
      })

      c.x.domain([0, data.sharedHyper.max_steps])
      c.y = d3.scaleLog().domain([1e0, 1e-8]).range([0, c.height])

      c.xAxis.ticks(3).tickFormat(d => d/1000 + 'k')
      c.yAxis = d3.axisLeft(c.y).ticks(6)

      d3.drawAxis(c)
      util.ggPlot(c)
      c.svg.selectAll('.y text').st({opacity: d => +[1, 1e-4, 1e-8].includes(d)})
      c.svg.selectAll('.x text').at({y: 4})

      util.addAxisLabel(c, 'steps', 'loss', 26, -24)
      if (chartIndex % 3) c.svg.selectAll('.y text').remove()


      var line = d3.line().x(d => c.x(d.step))

      var trainPathSel = c.svg.append('path')
        .at({strokeWidth: 2, stroke: util.colors.train, fill: 'none'})
      var testPathSel = c.svg.append('path')
        .at({strokeWidth: 2, stroke: util.colors.test, fill: 'none'})

      state.renderAll.hover.fns.push(async () => {
        var timeoutId = setTimeout(() => {
          trainPathSel.at({d: 'M 0 0'})
          testPathSel.at({d: 'M 0 0'})
        }, 300)

        var m = data.models.filter(state.isHoveredFn)[chartIndex]
        var root = `${util.getRoot()}/sparse_parity/${state.sweepSlug}`
        var metrics = await (await fetch(`${root}/${m.slug}/metrics.json`)).json()

        clearTimeout(timeoutId)
        trainPathSel.at({d: line.y(d => c.y(d.train_loss))(metrics)})
        testPathSel.at({d: line.y(d => c.y(d.eval_loss))(metrics)})
      })
    }
  }


  function drawGrid({state, sel}){
    sel.select('.model-grid').html('')
      .appendMany('div.lr-row', d3.nestBy(_.sortBy(data.models, d => +d[state.key_row]), d => d[state.key_row]))
      .appendMany('div.chart-div', d => d3.nestBy(_.sortBy(d, d => +d[state.key_col]), d => d[state.key_col]))
      .each(drawGridChart)

    function drawGridChart(models, i){
      var sel = d3.select(this)

      var c = d3.conventions({
        sel: sel.append('div'),
        width: 90,
        height: 90,
        margin: {left: 10, right: 0}
      })

      c.x = d3.scaleBand().range([0, c.width]) .domain(state.hyper_sweep[state.key_x])
      c.y = d3.scaleBand().range([0, c.height]).domain(state.hyper_sweep[state.key_y])

      c.xAxis = d3.axisBottom(c.x).tickValues(state.hyper_sweep[state.key_x])
        .tickFormat(d => d)
        // .tickFormat(d => d3.format('.0e')(d))
      c.yAxis = d3.axisLeft(c.y).tickValues(state.hyper_sweep[state.key_y])
        .tickFormat(d => d)
      d3.drawAxis(c)

      c.svg.selectAll('.axis line').remove()
      c.svg.selectAll('.y text').at({x: 0})
      c.svg.selectAll('.x text').at({y: 3})
      util.addAxisLabel(c, util.keyFmt(state.key_x), util.keyFmt(state.key_y), 20, -26)
      if (i) c.svg.select('.y').remove()

      // c.svg.append('text.axis-label').text('e: ' + models[0][state.key_row])
      //   .translate([0, -2])

      c.svg.append('text.axis-label')
        .text(util.keyFmt(state.key_col) + ': ' + d3.format('.2f')(models[0][state.key_col]))
        .translate([c.width/2, -2])
        .at({textAnchor: 'middle'}).st({fontSize: 9.5})

      var diam = 5
      var circleSel = c.svg.appendMany('circle', models)
        .at({r: diam/2, stroke: '#333', cx: d => c.x(d[state.key_x]), cy: d => c.y(d[state.key_y])})
        .call(d3.attachTooltip)
        .translate(d => [diam*Math.floor(d.seed/3) + diam, diam*(d.seed % 3) + diam])
        .on('mouseover', d => {
          state.hovered = d
          d3.selectAll('circle').classed('is-hovered', 0)

          state.renderAll.hover()
        })

      state.renderAll.hover.fns.push(() => {
        circleSel.classed('is-hovered', state.isHoveredFn)
      })

      state.renderAll.color.fns.push(() => {
        circleSel.at({fill: state.circleFillFn})
      })
    }
  }
})

