window.highlightColor = '#bf0bbf'

window.makeSliders = function(metrics, sets, c, selectSet, drawRow, onRender){

  var width = 180
  var height = 30
  var color = '#000'

  var xScale = d3.scaleLinear().range([0, width]).domain([0, 1])
    .clamp(1)

  var sliderSel = c.svg.appendMany('g', metrics)
    .translate((d, i) => [-c.margin.left -10 , 130*i + 30])
    .on('click', function(d){
      d.target = xScale.invert(d3.mouse(this)[0])
      render()
    })
    .classed('slider', true)
    .st({cursor: 'pointer'})

  var textSel = sliderSel.append('text.slider-label-container')
    .at({y: -20, fontWeight: 500, textAnchor: 'middle', x: 180/2})

  sliderSel.append('rect')
    .at({width, height, y: -height/2, fill: 'rgba(0,0,0,0)'})

  sliderSel.append('path').at({
    d: `M 0 -.5 H ${width}`, 
    stroke: color,
    strokeWidth: 1
  })

  var leftPathSel = sliderSel.append('path').at({
    d: `M 0 -.5 H ${width}`, 
    stroke: color,
    strokeWidth: 3
  })

  var drag = d3.drag()
    .on('drag', function(d){
      var x = d3.mouse(this)[0]
      d.target = xScale.invert(x)
      render()
    })

  var circleSel = sliderSel.append('circle').call(drag)
    .at({r: 7, stroke: '#000'})


  var exSel = c.svg.append('g').translate([-c.margin.left -10, 400])
    .st({fontSize: 13})

  var curY = 0
  exSel.append('g')
    .append('text').text('The selected set is...')

  var selectedSetG = exSel.append('g.selected').translate([-10, curY += 15])
    .datum(sets[0])
    .call(drawRow)

  selectedSetG.select('.no-stroke').classed('selected', 1)

  curY += 25
  var exMetrics = exSel.appendMany('g', metrics)
    .translate(() => curY +=22, 1)
    .append('text').html(d => '10% small, 10% more than target')

  curY += 10
  var exMeanDiff = exSel.append('text').translate(() => curY +=22, 1)
    .at({textAnchor: 'end', x: 190})
  var exMaxDiff = exSel.append('text').translate(() => curY +=22, 1)
    .at({textAnchor: 'end', x: 190})


  // Make histogram data
  sliderSel.each(function(metric){
    var countKey = metric.key + '_count'
    sets.forEach(set => {
      var v = d3.sum(set, d => d[metric.field] == metric.key)
      set[countKey] = v / set.length
    })

    var byCountKey = d3.nestBy(sets, d => d[countKey])

    d3.range(.1, 1, .1).forEach(i => {
      if (byCountKey.some(d => d.key*100 == Math.round(i*100))) return

      var rv = []
      rv.key = i 
      byCountKey.push(rv)
    })

    byCountKey.forEach(d => {
      d.metric = metric
      d.key = +d.key
    })

    var countSel = d3.select(this).append('g.histogram').lower()
      .translate(30, 1)
      .appendMany('g', byCountKey)
      .translate(d => xScale.clamp(0)(d.key - .05), 0)
    xScale.clamp(1)

    countSel.append('text')
      // .text(d => '10')
      .at({fontSize: 11, opacity: .7, y: -8, textAnchor: 'middle', x: 9.5})
      .text(d => d.key*100)

    countSel.append('path')
      .at({d: 'M 9.5 -18 V -30', stroke: '#ccc'})

    countSel
      .appendMany('rect.histogram-set', d => d)
      .at({width: 16, height: 4, x: 1.5, y: (d, i) => i*6})
      // .on('mouseover', selectSet)
  })
  var histogramSetSel = sliderSel.selectAll('rect.histogram-set')
    .st({cursor: 'default'})

  var axisSel = sliderSel.selectAll('.histogram text')


  var pinkSel = sliderSel.append('g')
    .at({r: 4, fill: highlightColor})
    .st({pointerEvents: 'none', opacity:0})
  pinkSel.append('path').at({stroke: highlightColor, d: 'M .5 0 V 15'})
  pinkSel.append('text').at({y: 30, textAnchor: 'middle'})
  pinkSel.append('text.score').at({y: 50, textAnchor: 'middle'})


  function render(){
    circleSel.at({cx: d => xScale(d.target)})
    // circleSel.at({cx: d => xScale(d.target)})
    textSel.text(d => (d.str + ' Target: ').replace('s ', ' ') + pctFmt(d.target))

    axisSel
      .classed('selected', false)
      // .text(function(d){
      //   var str = Math.round(100*Math.abs(d.key - d.metric.target))

      //   if (d.some(e => e.selected)){
      //     d3.select(this).classed('selected', 1)
      //     // str = str + '%'
      //   }

      //   return str
      // })

    leftPathSel.at({d: d => `M 0 -.5 H ${xScale(d.target)}`})
    metrics.forEach(d => {
      d.scoreScale = d3.scaleLinear()
        .domain([-.1, d.target, 1.1])
        .range([0, 1, 0])
    })
    histogramSetSel.st({fill: d => d === sets.selected ? highlightColor: '#bbb'})

    if (onRender) onRender()

    var shapes = sets.selected

    var metricVals = metrics.map(m => {
      return d3.sum(shapes, (d, i) => shapes[i][m.field] == m.key)/shapes.length
    })

    pinkSel.translate((d, i) => xScale(metricVals[i]), 0)
    pinkSel.select('text').text((d, i) => pctFmt(metricVals[i]))
    pinkSel.select('.score').text((d, i) => 'Difference: ' + Math.round(shapes.score[i]*100))


    selectedSetG.html('')
      .datum(sets.selected)
      .call(drawRow)

    selectedSetG.select('.no-stroke').classed('selected', 1)

    exMetrics
      .html((d, i) => {
        var target = d.target
        var actual = sets.selected[d.key + '_count']
        var diff = sets.selected.score[i]

        var str = d.str.replace('ls', 'l').replace('ns', 'n').toLowerCase()

        return `
          ${pctFmt(actual)}
          ${str}, 
          ${pctFmt(diff)} 
          ${actual < target ? 'less' : 'more'} than target
        `
      })
      .at({textAnchor: 'end', x: 190})

    exMeanDiff
      .text('Mean Difference: ' + d3.format('.2%')(sets.selected['Utilitarian']/100))

    exMaxDiff
      .text('Max Difference: ' + measures[1].ppFn(sets.selected['score']).replace('%', '.00%'))

  }

  return {render}
}


// window.initColumns('#columns-height', metrics1, measures)
// window.initColumns('#columns-height-disagree', metrics2, measures2)
