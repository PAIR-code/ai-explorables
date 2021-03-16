window.initColumns = function(id, metrics, measures){
  var c = d3.conventions({
    sel: d3.select(id).html('').st({width: 775, margin: '0px auto', left: 27}),
    margin: {left: 260, top: 40},
    height: 600,
  })

  var sets = d3.range(numRows).map(i => {
    var shapes = columnShapes[i]
    shapes = _.sortBy(shapes, d => d.shape)
    shapes = _.sortBy(shapes, d => d.size)
    shapes = _.sortBy(shapes, d => d.color)
    shapes = _.sortBy(shapes, d => d.color == 'green' ? 0 : 1)


    shapes.nG = d3.sum(shapes, d => d.color == 'green')
    shapes.nB = d3.sum(shapes, d => d.color == 'blue')
    shapes.nO = d3.sum(shapes, d => d.color == 'orange')
    shapes.nR = d3.sum(shapes, d => d.color == 'red')

    shapes.forEach((d, i) => {
      d.i = i
      d.sizeVal = d.sizeVal < 1 ? .6 : 1
    })
    shapes.i = i
    return shapes
  })

  var colW = 200
  var colWpad = 50
  var colH = 20
  var colHpad = 10
  var offsetW = -20

  var colSel = c.svg.appendMany('g', measures)
    .translate((d, i) => [.5 + i*(colW + colWpad) + offsetW, .5])

  colSel.append('text').text(d => d.ranking_display_text)
    .at({y: -20, textAnchor: 'middle', x: colW/2, fontWeight: 600, })

  var rowSel = colSel.appendMany('g.row', sets)
    .translate(d => d.i*(colH + colHpad), 1)

  var colMean = colSel.filter((d, i) => i === 0)
  var colMin = colSel.filter((d, i) => i === 1)
  var scoreLabelsMean = colMean.selectAll('.row').append('text')
    .at({x: -5, y: 15, textAnchor: 'end'})
    .st({fontSize: '13px', opacity: .7})
  var scoreLabelsMin = colMin.selectAll('.row').append('text')
    .at({x: 222, y: 15, textAnchor: 'end'})
    .st({fontSize: '13px', opacity: .7})

  colSel.each(function(d, i){ 
    d.rowSel = d3.select(this).selectAll('.row') 

    c.svg.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '-10 -10 20 20')
        .attr('markerWidth', 20)
        .attr('markerHeight', 20)
        .attr('orient', 'auto')
      .append('path')
        .attr('d', 'M-6.75,-6.75 L 0,0 L -6.75,6.75')
        .at({fill: '#000'})


    if (i){
      var pathstr = ['M', 160, -25, 'C', 215, -25, 215, -25, 215, -5].join(' ')
    } else{
      var pathstr = ['M', 35, -25, 'C', -20, -25, -20, -25, -20, -5].join(' ')
    }
    d3.select(this).append('path')
      .at({stroke: '#000', fill: 'none', d: pathstr, markerEnd: 'url(#arrow)', strokeWidth: .6})
  })


  var s = colH
  var p = 2 

  var l0Sel = c.svg.appendMany('path.set', sets).classed('set1', true)
    .translate(d => [colW + offsetW, s/2 + .5])

  drawRow(rowSel)
  function drawRow(rowSel){
    rowSel.append('rect.set.no-stroke')
      .at({x: -p, y: -p, width: colW + p*2, height: colH + p*2, fill: '#fff'}).classed('set1', true)

    rowSel.appendMany('g', d => d)
      .translate(d => [d.i*s + s/2, s/2])
      .each(function(d){

        var sOffset = 12
        var classNames = [d.shape, d.size, d.color, 'rank-item'].join(' ')
        var shapeSel = d3.select(this).append('rect')
          .at({
            x: -s/2,
            y: -s/2 + (d.size == 'small' ? sOffset/2 : 0) - .5,
            width: s - .5,
            height: s -  (d.size == 'small' ? sOffset : 0),
            fill: d.fill,
            class: classNames
          })

        if (d.shape == 'triangle'){
            var shapeSel = d3.select(this).append('circle')
              .at({r: 2, fill: '#fff', stroke: '#000', strokeWidth: .5,  class: classNames})
        }
      })

  }

  var setSel = c.svg.selectAll('.set1') 
    .on('mouseover', selectSet)

  sets.selected = sets[0]
  function selectSet(set){
    sets.selected = set
    sets.forEach(d => d.selected = d == set)
    setSel
      .classed('selected', d => d.selected)
      .filter(d => d.selected)
      .lower()

    rowSel.classed('selected', d => d.selected)

    sliders.render()
  }


  var sliders = makeSliders(metrics, sets, c, selectSet, drawRow, () => {
    sets.forEach(shapes => {
      shapes.score = metrics.map(m => {
        var v = d3.sum(shapes, (d, i) => shapes[i][m.field] == m.key)
        return Math.abs(m.target - v/shapes.length)
      })
    })

    measures.forEach(m => {
      sets.forEach(shapes => {
        shapes[m.str] = m.fn(shapes.score)
      })
      _.sortBy(sets, d => d[m.str] + d.i/10000000)//.reverse()
        .forEach((d, i) => d['i' + m.str] = i)

      m.rowSel.translate(d => d['i' + m.str]*(colH + colHpad), 1)
    })

    var p = 0
    l0Sel.at({d: d => [
      'M', p,         d['iUtilitarian']*(colH + colHpad),
      'L', colWpad - p, d['iEgalitarian']*(colH + colHpad),
    ].join(' ')})


    scoreLabelsMean.text(d => {
      return d3.format('.2f')(d['Utilitarian'])// + '%'
    })
    scoreLabelsMin.text(d => {
      return measures[1].ppFn(d['score']).replace('%', '')// + '%'
    })
  })

  sliders.render()
  selectSet(_.sortBy(sets, d => d.iEgalitarian)[0])
}
window.initColumns('#columns-height', metrics1, measures)
window.initColumns('#columns-height-disagree', metrics2, measures2)

// Only highlight green items in the second ranking chart. 
d3.select('#columns-height-disagree').selectAll('.rank-item').at({opacity: .3})
d3.select('#columns-height-disagree').selectAll('.green').at({opacity: 1})

// Only highlight the green slider in the second ranking chart.
d3.select('#columns-height-disagree').selectAll('.slider').at({opacity: d => {
  return d.key !== 'green' ? 0.35: 1
}})

