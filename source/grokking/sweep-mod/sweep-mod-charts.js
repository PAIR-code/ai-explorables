window.sweepModCharts = (function(){

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

  function drawFormula({state, sel}){
    var element = sel.select('.formula').html('').node()
    var str = `
      \\text{ReLU} \\left(
        a_{\\text{one-hot}} \\mathbf{W}_{\\text{in-embed}} \\mathbf{W}_{\\text{in-proj-a}} + 
        b_{\\text{one-hot}} \\mathbf{W}_{\\text{in-embed}} \\mathbf{W}_{\\text{in-proj-b}} 
      \\right) 
      \\textbf{W}_{\\text{out-proj}} \\textbf{W}_{\\text{out-embed}}^{\\top}
    `

    var d = state.actualHovered || state.hovered
    if (d.is_collapsed_hidden == 'true'){
      str = str.replaceAll('\\mathbf{W}_{\\text{in-proj-a}}', '')
      str = str.replaceAll('\\mathbf{W}_{\\text{in-proj-b}}', '')
    }
    if (d.embed_config == 'tied'){
      str = str.replaceAll('in-embed', 'embed')
      str = str.replaceAll('out-embed', 'embed')
    }
    if (d.is_tied_hidden == 'true'){
      str = str.replaceAll('in-proj-a', 'in-proj')
      str = str.replaceAll('in-proj-b', 'in-proj')
    }
    if (d.is_collapsed_out == 'true'){
      str = str.replaceAll('\\textbf{W}_{\\text{out-proj}}', '')
    }

    sel.select('.formula')
      .html(MathJax.tex2chtml(str, {em: 12, ex: 6, display: false}).outerHTML)

    // Not sure if this is better?
    // 
    // el.innerHTML = `\\(${latex}\\)`; 
    // MathJax.typesetPromise([el]);
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

  function drawWdType({state, sel, key}){
    var models = state[key]
    var isL1 = models.isL1
    var hyper_sweep = {
      'seed': [0, 1, 2, 3, 4, 5, 6, 7, 8],
      'learning_rate': [1e-2, 1e-3, 1e-4],
      'weight_decay': models.isL1 ? [1e-4, 1e-5, 1e-6, 1e-7, 1e-8] : [1, .3, .1, .03, .01],
      'weight_decay': models.isL1 ? [1e-7, 1e-8, 1e-9, 1e-10, 1e-11] : [1, .3, .1, .03, .01],
      'embed_size': [32, 64, 128, 256, 512],
    }

    var fields = 'embed_config is_tied_hidden is_collapsed_hidden is_collapsed_out regularization'.split(' ')
    models.forEach(d => {
      d.minEvalLoss = +d.minEvalLoss
      d.minTrainLoss = +d.minTrainLoss
      d.maxRatio = +d.maxRatio
      d.weight_decay = +d.weight_decay

      d.type = fields.map(key => key + ': ' + d[key]).join(' ')
      d.typeHTML = fields.map(key => `<span class='key-val'>${key} <b>${d[key]}</b></span>`)
        .join('')
        .replaceAll('is_', ' ')
        .replaceAll('_config', '')
    })

    state[key] = models = models
      .filter(d => d.is_symmetric_input == 'false')
      .filter(d => d.embed_config != 'untied')
      .filter(d => hyper_sweep.weight_decay.includes(d.weight_decay))
    models.hyper_sweep = hyper_sweep
    models.isL1 = isL1
    state[key] = models
    // models.forEach(d => d.models = models)

    var typeSel = sel.select('.wd-type-container').append('div')
    typeSel.append('div').translate([-240, -93]).st({height: 20})
      .append('div').st({transform: 'rotate(-90deg)', 'letter-spacing':'2px'})
      .append('b')
      .html((models.isL1 ? 'L1' : 'L2') + ' Weight Decay')

    var byType = d3.nestBy(_.sortBy(models, d => d.type), d => d.type)
    typeSel.append('div')
      .appendMany('div.lr-row', d3.nestBy(byType, d => d[0].embed_config)).st({width: 430, margin: '0px auto'})
      .append('div.type-label').html(d => `${d[0][0].embed_config == 'tied' ? 'Tied' : 'Untied'} W_embed`).st({marginBottom: 0, marginTop: 0}).parent()
      .appendMany('div.chart-div', d => d3.nestBy(d, d => d[0].is_tied_hidden))
      .each(drawTypeGrid)

    function drawTypeGrid(types){
      var sel = d3.select(this)

      sel.append('div.type-label')
        .html(types[0][0].is_tied_hidden == 'true' ? 'Tied W_proj-in' : 'Untied W_proj-in')

      var pad = 8
      var rw = 80
      var rh = 12

      var c = d3.conventions({
        sel: sel.append('div'),
        width: rw*2 + pad,
        height: rh*2 + pad,
        layers: 'ds',
        margin: {top: 5, bottom: 40}
      })

      c.svg.append('g.x.axis')
        .translate(c.height + 12, 1)
        .appendMany('text', ['T', 'F'])
        .text(d => d)
        .translate((d, i) => i ? rw/2 : rw + pad + rw/2, 0)

      c.svg.append('g.y.axis')
        .translate(-8, 0)
        .appendMany('text', ['T', 'F'])
        .text(d => d)
        .translate((d, i) => i ? rh/2 : rh + pad + rh/2, 1)
        .at({dy: '.33em'})

      util.addAxisLabel(c, 'collapsed_in', 'collapsed_out', 8, -6)

      if (types[0][0].is_tied_hidden == 'true') c.svg.select('.y').remove()

      var typeSel = c.svg.appendMany('g', types)
        .translate(d => [
          d[0].is_collapsed_hidden == 'false' ? .5 : rw + pad + .5,
          d[0].is_collapsed_out == 'false' ? .5 : rh + pad + .5,
        ])
        .on('mouseenter', d => {
          state.hoveredType = d[0].type
          state.actualHovered = d[0]

          if (state.hovered.regularization == d[0].regularization){
            state.hovered = JSON.parse(JSON.stringify(state.hovered))
            state.hovered.type = state.hoveredType
          } else {
            state.hovered = d[0]
          }

          state.renderAll.type()
        })

      types.forEach(type => {
        var rectData = type.rectData = [
            util.colors.sweepNoGen, 
            util.colors.sweepGrok, 
            util.colors.sweepGen, 
            util.colors.sweepNoLearn, 
          ]
          .map((key, i) => ({key, i, count: 0}))

        rectData.lookup = {}
        rectData.forEach(d => rectData.lookup[d.key] = d)
      })

      var bgRectSel = typeSel.append('rect')
        .at({width: rw, height: rh, stroke: '#000', fill: '#fff'})

      var rectSel = typeSel.appendMany('rect', d => d.rectData)
        .at({height: rh, fill: d => d.key, width: 20})

      state.renderAll.type.fns.push(() => {
        bgRectSel.at({strokeWidth: d => state.hoveredType == d.key ? 3 : 1})

        state.renderAll.hover()
      })

      state.renderAll.color.fns.push(() => {
        types.forEach(type => {
          var rectData = type.rectData
          rectData.forEach(d => d.count = 0)

          type.forEach(d => {
            rectData.lookup[state.circleFillFn(d)].count++
          })

          rectData.forEach(d => d.percent = d.count/d3.sum(rectData, d => d.count))

          var prev = 0
          rectData.forEach(d => {
            d.prev = prev
            prev += d.percent
          })
        })

        rectSel.at({width: d => d.percent*rw, x: d => d.prev*rw})
      })
    }
  }

  function drawLineCharts({state, sel}){
    sel.select('.line-charts').html('').st({margin: '0px auto'})
      .appendMany('div', d3.range(9)).st({display: 'inline-block'})
      .each(drawChart)

    state.renderAll.hover.fns.push(() => {
      var h = state.hovered 

      var keys = [state.key_x, state.key_y, state.key_col] // state.key_row

      var isL1 = state.hovered.regularization == 'l1'
      sel.select('.line-chart-hyper').html('')
        .appendMany('div.chart-title', keys)
        .html(d => util.keyFmt(d).replace('Weight', isL1 ? 'L1 Weight' : 'L2 Weight') + ': <b>' + h[d] + '</b>')
        .st({display: 'inline-block', fontSize: 11})
    })
    state.renderAll.hover.fns.at(-1).isRight = 1

    function drawChart(chartIndex){
      var c = d3.conventions({
        sel: d3.select(this).append('div'),
        width: 135,
        height: 55,
        margin: {right: 0, left: 30, top: 10, bottom: 20}
      })

      c.x.domain([0, state.sharedHyper.max_steps])
      c.y = d3.scaleLog().domain([1e4, 1e-8]).range([0, c.height])

      c.xAxis.ticks(2).tickFormat(d => d/1000 + 'k')
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

        var m = state.models.filter(state.isHoveredFn)[chartIndex]
        var root = `${util.getRoot()}/mlp_modular/${state.sweepSlug}`
        if (!m) return //console.log('missing')
        var metrics = await (await fetch(`${root}/${m.slug}/metrics.json`)).json()

        clearTimeout(timeoutId)
        trainPathSel.at({d: line.y(d => c.y(d.train_loss))(metrics)})
        testPathSel.at({d: line.y(d => c.y(d.eval_loss))(metrics)})
      })
      state.renderAll.hover.fns.at(-1).isRight = 1

    }
  }

  function drawGrid({state, sel}){
    sel.select('.model-grid').html('')
      .appendMany('div.lr-row', d3.nestBy(_.sortBy(state.models, d => +d[state.key_row]), d => d[state.key_row]))
      .appendMany('div.chart-div', d => d3.nestBy(_.sortBy(d, d => +d[state.key_col]), d => d[state.key_col]))
      .each(drawGridChart)

    function drawGridChart(models, i){
      var sel = d3.select(this)
      var isL1 = models[0].regularization == 'l1'

      var c = d3.conventions({
        sel: sel.append('div'),
        width: 90,
        height: 55,
        margin: {left: 10, right: 0}
      })

      c.x = d3.scaleBand().range([0, c.width]) .domain(state.hyper_sweep[state.key_x])
      c.y = d3.scaleBand().range([0, c.height]).domain(state.hyper_sweep[state.key_y])

      c.xAxis = d3.axisBottom(c.x).tickValues(state.hyper_sweep[state.key_x])
        .tickFormat((d, i) => isL1 ? i % 2 ? '' : d : ('' + d).replace('0.', '.'))
      c.yAxis = d3.axisLeft(c.y).tickValues(state.hyper_sweep[state.key_y])
        .tickFormat(d => d)
        .tickFormat(d => d3.format('.0e')(d))
      d3.drawAxis(c)

      c.svg.selectAll('.axis line').remove()
      c.svg.selectAll('.y text').at({x: 0})
      c.svg.selectAll('.x text').at({y: 3})
      util.addAxisLabel(c, util.keyFmt(state.key_x), util.keyFmt(state.key_y), 20, -26)
      if (i) c.svg.select('.y').remove()

      // c.svg.append('text.axis-label').text('e: ' + models[0][state.key_row])
      //   .translate([0, -2])

      c.svg.append('text.axis-label')
        // .text(util.keyFmt(state.key_col) + ': ' + models[0][state.key_col])
        .text(util.keyFmt(state.key_col) + ': ' + models[0][state.key_col])
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
      state.renderAll.hover.fns.at(-1).isRight = 1

      state.renderAll.color.fns.push(() => {
        circleSel.at({fill: state.circleFillFn})
      })
      state.renderAll.color.fns.at(-1).isRight = 1
    }
  }

  return {
    drawWdType,
    drawLegend,
    drawLineLegend,
    drawFormula,
    drawSliders,
    drawLineCharts,
    drawGrid,
  }
})()

window.initModSweep?.()
