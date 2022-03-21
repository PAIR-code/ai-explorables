
window.drawCalibrationCurve = function (graphSel, fig_height, fig_width){
  var width = Math.min(fig_height, fig_width)
  var sel = graphSel
    .append('div').st({textAlign: 'center'})
    .append('div').st({display: 'inline-block'})

  var c = d3.conventions({
    sel,
    width,
    height: width,
    margin: {top: 40}
  });

  c.svg.parent()

  //TODO(nthain) Who owns the buckets? We have at least 2 instances, reduce to 1
  var buckets = d3.pairs(window.weatherGraph.thresholds)
  buckets.forEach(bucket => {
    bucket.val = d3.mean(bucket, d => d.origVal)
  })

  c.xAxis.tickValues(buckets.map(d => d.val)).tickFormat(d3.format('.2f'))
  c.yAxis.tickValues(buckets.map(d => d.val)).tickFormat(d3.format('.2f'))
  d3.drawAxis(c)
  window.util.ggPlotBg(c)

  window.util.addAxisLabel(c, 'Calibrated Model Score', 'Probability of Rain')

  var eceSel = c.svg.append('g.ece')
  var eceBox = eceSel.append('rect.val-box')
    .at({width: 55, height: 20, x: c.width/2 + 72.5, y: -35, rx: 3, ry: 3})
  var eceText = eceSel.append('text.big-text')
    .at({y: -20, x: c.width/2-30, textAnchor: 'middle'})
  var eceVal = eceSel.append('text.val-text')
    .at({y: -20, x: c.width/2+100, textAnchor: 'middle'})

  c.svg.append('path')
    .at({
      d: ['M', 0, c.height, 'L', c.width, 0].join(' '), 
      stroke: '#555',
      strokeDasharray: '3 3',
    })

  var bucketSel = c.svg.appendMany('g.bucket', buckets)

  var circleSel = bucketSel.append('circle')
    .at({fillOpacity: .4, fill: 'steelblue'})

  var pathSel = bucketSel.append('path')
    .at({stroke: 'steelblue', strokeWidth: 3})

  var bucketText = bucketSel.append('text').text('8 / 10')
    .at({textAnchor: 'start', dy: '.33em', fontSize: 10, fill: '#000'})


  // function remap_score(s) {
  //   // new_score = min_threshold_new + (old_score-min_threshold_old)(max_threshold_new-min_threshold_new)/(max_threshold_old-min_threshold_old)
  //   //find index less than score
  // }

  function renderBuckets(){
    var filter_rain = window.slides.slide?.filter_rain

    buckets.forEach(bucket => {
      bucket.data = weatherdata
        .filter(d => bucket[0].val <= d.score && d.score <= bucket[1].val)
        .filter(d => !filter_rain || !d.is_filter)

      bucket.nPositive = d3.sum(bucket.data, d => d.label)
      bucket.percent = bucket.nPositive/bucket.data.length

      if (isNaN(bucket.percent)) bucket.percent = bucket[0].val
    })

    var ece = d3.sum(buckets, d => d.data.length*Math.abs(d.val - d.percent))
    ece = ece/d3.sum(buckets, d => d.data.length)

    eceText.text('Expected Calibration Error: ')
    eceVal.text(d3.format('.3f')(ece))

    var rScale = d3.scaleSqrt().domain([0, 50]).range([0, 20])

    bucketSel
      .st({opacity: d => d.data.length})
      .filter(d => d.data.length)
      .translate(d => [c.x(d.val), c.y(d.percent)])

    circleSel
      .at({r: d => rScale(d.data.length)})

    pathSel.at({d: d => 'M 0 0 V ' + (c.y(d.val) - c.y(d.percent))})

    bucketText
      .text(d => `${d.nPositive} / ${d.data.length}`)
      .at({x: d => rScale(d.data.length) + 2})
  }

  return {renderBuckets, c, buckets, calibrationDataFn: () => console.log('test')}
}

if (window.init) window.init()
