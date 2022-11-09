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



window.chart = (function(){
  var addAxisLabel = (c, xText, yText, xTopText, xOffset=40, yOffset=-40) => {
    c.svg.select('.x').append('g')
      .translate([c.width/2, xOffset])
      .append('text.axis-label')
      .text(xText)
      .at({textAnchor: 'middle'})
      .st({fill: '#000', fontSize: 14})

    c.svg.select('.y')
      .append('g')
      .translate([yOffset, c.height/2])
      .append('text.axis-label')
      .text(yText)
      .at({textAnchor: 'middle', transform: 'rotate(-90)'})
      .st({fill: '#000', fontSize: 14})

     c.svg.select('.x-top').append('g')
      .translate([c.width/2, -xOffset/2])
      .append('text.axis-label')
      .text(xTopText)
      .at({textAnchor: 'middle'})
      .st({fill: '#000', fontSize: 14})   
  }

  var ggPlotBg = (c, isBlack=true) => {
    c.svg.append('rect')
      .at({width: c.width, height: c.height, fill: '#e9e9e9'})
      .lower()

    c.svg.selectAll('.tick').selectAll('line').remove()
    c.svg.selectAll('.y .tick')
      .append('path').at({d: 'M 0 0 H ' + c.width, stroke: '#fff', strokeWidth: 1})
    c.svg.selectAll('.y text').at({x: -3})
    c.svg.selectAll('.x .tick')
      .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1})
  }

  function initLine(sharedConfig){
    var isFull = sharedConfig.slug == 'full'
    var hasLegend = sharedConfig.lineLegend
    var hasSlider = sharedConfig.onSliderDrag
    var colorScale = sharedConfig.lineColorScale || d3.interpolateWarm
    var mergeRate = sharedConfig.allModelSettings[0].mergeRate
    var showMergeTicks = sharedConfig.allModelSettings.every(d => d.mergeRate == mergeRate)

    var c = d3.conventions({
      sel: sharedConfig.sel.select('.line-chart').html(''),
      height: isFull ? 270 : 200,
      width: isFull ? 350 : 300,
      margin: {left: 80, bottom: 40, top: 50}
    })

    if (hasLegend){
      var legendSel = c.svg.append('g.legend').translate([c.width + 80, c.height/2 + (hasSlider ? -0 : 0)])
      legendSel.append('text').st({fontSize: 14})
        .text(sharedConfig.lineLegend)
        .at({textAnchor: 'middle'})

      var legendScale = d3.scaleLinear().domain([0, 1]).range([-60, 60])

      if (sharedConfig.slug == 'outlier'){
        var numOutliers = 5
        var rs = 17
        var blockSel = legendSel.appendMany('g', d3.range(numOutliers))
          .translate(i => [(i - numOutliers/2)*(rs+2), 5])
        blockSel.append('rect')
          .at({width: rs, height: rs, fill: i => colorScale(i/(numOutliers - 0)), xstroke: '#ccc'})

        blockSel.append('text').text(i => i)
          .at({dy: '.33em', y: rs/2, textAnchor: 'middle', x: rs/2})
      } else {
        var n = 120
        legendSel.appendMany('rect', d3.range(0, 1, 1/n))
          .at({height: 15, y: 4, width: 1, x: legendScale, fill: sharedConfig.slug == 'dp' ? d => colorScale(d*5) : colorScale})
      }
    }
    if (sharedConfig.hasDashedLegend){
      var dashedLegendSel = c.svg.append('g.legend')
        .translate([c.width + 38, c.height/2 + 60])
        .append('text.axis-label').text('Outlier Status').st({fontSize: 14})
        .parent()
        .appendMany('g', ['Included', 'Excluded'])
        .translate((d,i) => [43, i*15 + 15])
        .at({fontSize: 10, fill: 'rgb(61,64,67)'})

      dashedLegendSel.append('text').text(d => d)
      dashedLegendSel.append('path').at({
        d: 'M -43 -3 H -5',
        stroke: 'grey',
        strokeWidth: 1.5,
        strokeDasharray: (d,i) => i == 1 ? '2 2' : '',
      })
    }
    if (hasSlider){
      legendScale.domain([0, 5]).clamp(1)
      
      var drag = d3.drag()
        .on('drag', function(d){
          var v = legendScale.invert(d3.mouse(legendSel.node())[0])
          sharedConfig.onSliderDrag(v)
          renderSlider()
        })
        .on('end', function(){
          sharedConfig.onSliderDragEng()
          renderSlider()
        })

      var cursorSel = legendSel.append('g').translate(20, 1).append('g')
        .call(drag)
        .st({cursor: 'pointer'})
      cursorSel.append('text').text('▲').at({textAnchor: 'middle', fontSize: 22, dy: '.4em'})
      cursorSel.append('circle').at({r: 16, fillOpacity: 0, strokeWidth: 0})

      legendSel
        .st({cursor: 'pointer'})
        .on('click', function(){
          var v = legendScale.invert(d3.mouse(this)[0])

          sharedConfig.onSliderDrag(v)
          sharedConfig.onSliderDragEng()
          renderSlider()
        })

      function renderSlider(){
        cursorSel.translate(legendScale(sharedConfig.allModelSettings[0].dpNoise), 0)
      }
      renderSlider()
    }

    c.x.domain([0, sharedConfig.maxSteps]).interpolate(d3.interpolateRound)
    c.y.domain([.4, 1]).interpolate(d3.interpolateRound)

    c.xAxis.ticks(5).tickFormat(d => d ? d : '')
    if (sharedConfig.maxSteps == 198) c.xAxis.tickValues([0, 40, 80, 120, 160])
    c.yAxis.tickFormat(d3.format('.0%')).ticks(5)

    d3.drawAxis(c)
    c.xAxis
      .tickValues(d3.range(0, sharedConfig.maxSteps, mergeRate))
      .tickFormat(d => d ? d/mergeRate : '')

    var xTopAxisSel = c.svg.append('g.x-top.axis')
      .call(c.xAxis)
      .st({opacity: showMergeTicks ? 1 : 0})
    xTopAxisSel.selectAll('text').at({y:-9})

    addAxisLabel(c, 'Local Steps', 'Average Accuracy', 'Federated Rounds')
    ggPlotBg(c)

    var lineSel = c.svg.append('g')
    var lineSel2 = c.svg.append('g')

    var circleSel = c.svg.append('circle').at({r: 3, stroke: '#000'})

    function fillColor(d, i){
      var v = hasLegend ? d[0]?.hyperparms[0] : i/sharedConfig.allModelSettings.length
      return colorScale(v)
    }

    function lineStyle(d, i){
      return d[0].hyperparms[2] == 1 ? '2 2' : ''
    }

    function render(log){
      var log = sharedConfig.log
      var byKey = d3.nestBy(log, d => d.hyperparms)

      var line = d3.line()
        .x(d => c.x(d.counts.local))
        .y(d => c.y(d.accuracy))

      byKey.forEach(key => {
        key.merges = key.filter((d, i) => {
          var prev = key[i - 1]
          if (!prev) return false
          return prev.counts.merge != d.counts.merge
        })
      })

      if (sharedConfig.lineOnlyGlobal){
        lineSel2
          .html('')
          .appendMany('g', byKey)
          .at({fill: fillColor, stroke: fillColor})
          .appendMany('circle', d => d.merges)
          .translate(d => [c.x(d.counts.local), c.y(d.accuracy)])
          .at({r: 4, fillOpacity: .4, strokeWidth: 2})

        // circleSel.at({opacity: 0})
      }
      lineSel
        .html('')
        .appendMany('path', byKey)
        .at({
          stroke: fillColor,
          strokeWidth: 1.5,
          strokeDasharray: lineStyle,
          fill: 'none',
          d: line,
        })

      var last = _.last(log)
      if (!last) return
      circleSel
        .at({fill: fillColor([last], byKey.length - 1), opacity: 1})
        .translate([c.x(last.counts.local), c.y(last.accuracy)])
    }

    return {render}
  }

  function addDatasetHover(selection){
    selection
      .classed('hovered', false)
      .on('mouseover', d => {
        if (d?.isGlobal) return
        d.sharedConfig.sel.selectAll('.dataset').filter(e => e)
          .classed('hovered', e => d.index == e.index)
      })
      // the moving lines are hard to select w/ this on,
      // switch to mouseleave on container below
      // .on('mouseout', d => {
      //   d.sharedConfig.sel.selectAll('.dataset')
      //     .classed('hovered', false)
      // })
  }

  function initRescalingLine(sharedConfig){
    var c = d3.conventions({
      sel: sharedConfig.sel.select('.line-chart').html(''),
      height: 200,
      totalWidth: 400,
      margin: {left: 30, bottom: 35}
    })

    c.x.domain([0, 100]).interpolate(d3.interpolateRound)
    c.y.domain([.4, 1]).interpolate(d3.interpolateRound)

    c.xAxis.ticks(5)
    c.yAxis.tickFormat(d3.format('.0%')).ticks(5)

    d3.drawAxis(c)
    addAxisLabel(c, 'Local Steps', 'Accuracy')
    ggPlotBg(c)

    var xAxisSel = c.svg.select('.x')

    c.yAxis.tickFormat(d3.format('.0%')).ticks(5)

    var stubDatasets = d3.range(sharedConfig.allModelSettings[0].numClients)
      .map(index => ({index, sharedConfig}))

    var datasetLines = c.svg.append('g')
      .appendMany('path.dataset', stubDatasets)
      .call(addDatasetHover)

    var avgPlaceholderData = {index: -1, sharedConfig}
    var lineSel = c.svg.append('g').append('path.dataset.dataset-avg')
      .datum(avgPlaceholderData).call(addDatasetHover)

    setTimeout(() => {
      d3.select('dark-ul')
        .st({pointerEvents: 'all', cursor: 'default'})
        .datum(avgPlaceholderData).call(addDatasetHover)

      d3.select('global-circle').classed('dataset', 1)
        .st({pointerEvents: 'all', cursor: 'default'})
        .datum(mergePlaceholderData).call(addDatasetHover)
    }, 1000)

    var circlesSel = c.svg.appendMany('circle.dataset', stubDatasets)
      .at({r: 2, stroke: '#000', fill: '#aaa', strokeWidth: .5})
      .call(addDatasetHover)

    var circleSel = c.svg.append('circle.dataset').at({r: 2, stroke: '#000'})
      .datum(avgPlaceholderData).call(addDatasetHover)

    var mergePlaceholderData = {index: -2, sharedConfig, counts: {merge: 0}}
    var mergeLineSel = c.svg.append('path.dataset.global')
      .datum(mergePlaceholderData).call(addDatasetHover)
    var mergeCircleSel = c.svg.append('circle.dataset.global').at({r: 0, stroke: 'cyan', fill: '#000', strokeWidth: 2})
      .datum(mergePlaceholderData).call(addDatasetHover)

    sharedConfig.sel.on('mouseleave', () => {
      sharedConfig.sel.selectAll('.hovered').classed('hovered', 0)
    })

    function render(){
      var log = sharedConfig.log
      c.x.domain([0, Math.max(100, d3.max(log, d => d.counts.local))])
      xAxisSel.call(c.xAxis)

      c.svg.selectAll('.tick').selectAll('line').remove()
      c.svg.selectAll('.x .tick')
        .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1})

      var lineSmall = d3.line().x((d, i) => c.x(d.counts.local))
      datasetLines
        .at({
          stroke: '#aaa',
          fill: 'none',
          d: dataset => {
            lineSmall.y(d => c.y(d.datasetAccuracy[dataset.index]))
            return lineSmall(log)
          },
          strokeWidth: 1,
        })

      var line = d3.line().x(d => c.x(d.counts.local)).y(d => c.y(d.accuracy))
      lineSel        
        .at({
          stroke: '#000',
          fill: 'none',
          d: line(log),
          strokeWidth: 2,
        })

      var last = _.last(log)
      circlesSel.translate(dataset => [c.x(last.counts.local), c.y(last.datasetAccuracy[dataset.index])])
      circleSel.translate([c.x(last.counts.local), c.y(last.accuracy)])

      if (last.counts.merge == 0){
        mergePlaceholderData.counts.merge = 0
        mergeCircleSel.at({r: 0})
      }
      if (last.counts.merge > mergePlaceholderData.counts.merge){
        mergePlaceholderData.counts.merge = last.counts.merge
        mergePlaceholderData.counts.local = last.counts.local
        mergePlaceholderData.accuracy = last.accuracy
        mergeCircleSel.at({r: 4})

      }
      d3.select('.global-annotation').st({opacity: mergePlaceholderData.counts.merge ? 1 : 0})
      if (mergePlaceholderData.counts.merge){
        mergeCircleSel.translate(d => [c.x(d.counts.local), c.y(d.accuracy)])

        var mergeData = log.filter((d, i) => {
          if (d.counts.merge == 0) return false
          if (log[i - 1].counts.merge == d.counts.merge) return false
          return true
        })
        mergeData.push({counts: {local: last.counts.local}, accuracy: mergePlaceholderData.accuracy})
        var line = d3.line().x(d => c.x(d.counts.local)).y(d => c.y(d.accuracy)).curve(d3.curveStepAfter)
        mergeLineSel.at({d: line(mergeData)})
      }

    }

    return {render}
  }

  function initHeatmap(dataset, options={}){
    var color = d3.interpolatePuOr
    var colors = [color(.2), color(1 - .2)]

    var c = d3.conventions({
      sel: dataset.sel.html('').append('div.dataset').call(addDatasetHover),
      height: options.height || 80,
      width: options.width || 80,
      margin: {top: dataset.label ? 10 : 1, left: 1, bottom: 5, right: 5},
      layers: 'sccs',
    })
    var ctx = c.layers[1]
    var ctx2 = c.layers[2]
    var [canvas, canvas2] = c.sel.selectAll('canvas').nodes()

    c.sel
      .st({marginLeft: -4})
      .classed('is-outlier', dataset.isOutlier)
      .classed('is-disabled', dataset.isDisabled)

    var gs = 20
    var testPoints = d3.cross(d3.range(0, 1 + 1E-9, 1/gs), d3.range(0, 1 + 1E-9, 1/gs))
    var testPointsTensor = tf.tensor2d(testPoints)

    function drawMergeLines(){
      if (!dataset.sharedConfig) return
      if (dataset.isDisabled) return
      
      function isValidDataset(index){
        var datasets = dataset.sharedConfig.datasets
        return datasets[index] && !datasets[index].isDisabled
      }

      function drawMergeLine(path){
        c.svg.append('path.mergeline').at({d: path.join(' ')})
      }

      var i = dataset.index
      if (dataset.sharedConfig.slug == 'top'){
        if (isValidDataset(i - 1) && i % 6 != 0) drawMergeLine(['M', 0, c.height/2, 'h', -35])
        if (isValidDataset(i - 6))      drawMergeLine(['M', c.width/2, 0, 'v', -35])
      } else {
        if (isValidDataset(i - 1) && i % 8 != 0) drawMergeLine(['M', 0, c.height/2, 'h', -2])
        if (isValidDataset(i - 8) && i > 7) drawMergeLine(['M', c.width/2, 0, 'v', -2])
      }

      if (dataset.isGlobal){
        drawMergeLine(['M', 0, c.height/2, 'h', -2])
        drawMergeLine(['M', c.width + 4, c.height/2, 'h', 2])
        drawMergeLine(['M', c.width/2, 0, 'v', -2])
        drawMergeLine(['M', c.width/2, c.height + 4, 'v', 2])
      }
    }
    drawMergeLines()

    if (dataset.isGrid){
      c.xAxis.ticks(20).tickFormat(d => '')
      c.yAxis.ticks(20).tickFormat(d => '')
      d3.drawAxis(c)

      c.svg.selectAll('.tick').selectAll('line').remove()
      c.svg.selectAll('.y .tick')
        .append('path').at({d: 'M 0 0 H ' + c.width, stroke: '#eee', strokeWidth: 1})
      c.svg.selectAll('.y text').at({x: -3})
      c.svg.selectAll('.x .tick')
        .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#eee', strokeWidth: 1})

      c.svg.append('rect')
        .at({width: c.width, height: c.height, stroke: '#bbb', fillOpacity: 0})

      c.svg.append('text')
        .text(dataset.label)
        .at({textAnchor: 'middle', x: c.width/2, y: -2, fontSize: 12, fontFamily: 'monospace', fill: '#666'})
    }

    if (dataset.sharedConfig?.slug == 'top'){
      c.svg.append('text')
        .text('user ' + dataset.index)
        .at({textAnchor: 'middle', x: c.width/2, y: -2, fontSize: 12, fontFamily: 'monospace', fill: '#999'})
    }

    if (dataset.isDisabled){
      c.layers[3].append('text.black-shadow')
        .translate(d => [c.width/2, c.height/2 - 6])
        .at({textAnchor: 'middle', fontSize: 12, fontFamily: 'monospace', fill: '#fff'})
        .tspans(['excluded', 'from', 'training'], 12)
    }

    if (dataset.isGlobal){
      c.sel.datum({index: -2, sharedConfig: dataset.sharedConfig}).classed('global', 1)
      c.svg.append('text.axis-label')
        .at({textAnchor: 'middle', fontSize: 14})
        .translate([c.width/2, -20])
        // .text('Latest Global Model')
        .tspans(['Latest', 'Global Model'], 14)

      c.accuracySel = c.svg.append('g.axis')
        .translate([c.width/2, c.height + 13])
        .append('text')
        .at({textAnchor: 'middle', dy: '0.71em'}).st({fontSize: 12})
    }

    function render(isMergeAnimation){
      if (isMergeAnimation){
        ctx2.drawImage(canvas, -1,  -1, c.totalWidth, c.totalHeight)
        d3.select(canvas2)
          .st({opacity: 1})
          .transition().duration(dataset.sharedConfig.mergeAnimation ? dataset.sharedConfig.mergeAnimation/2 : 300)
          .st({opacity: 0})

        c.sel.classed('is-merging', 1)
        setTimeout(() => c.sel.classed('is-merging', 0), 1)
      }

      if (dataset.model){
        var predictionsTensor = dataset.model.predict(testPointsTensor)
        var predictions = predictionsTensor.dataSync()

        testPoints.forEach((d, i) => {
          ctx.beginPath()
          ctx.fillStyle = color(predictions[i])
          ctx.rect(c.x(d[0]), c.y(d[1]), c.x(1/gs), c.x(1/gs))
          ctx.fill()
        })
        predictionsTensor.dispose()

        ctx.beginPath()
        ctx.lineWidth = 1
        ctx.strokeStyle = '#333'
        dataset.data?.forEach(d => {
          ctx.moveTo(c.x(d.xOrig[0]), c.y(d.xOrig[1]))
          ctx.lineTo(c.x(d.x[0]), c.y(d.x[1]))
        })
        ctx.stroke()
      }

      ctx.lineWidth = .2
      ctx.strokeStyle = '#000'
      dataset.data?.forEach(d => {
        ctx.beginPath()
        ctx.arc(c.x(d.x[0]), c.y(d.x[1]), 2.5, 0, 2.5*Math.PI, false)
        ctx.fillStyle = colors[+d.y]
        ctx.fill()
        ctx.stroke()
      })

      if (c.accuracySel){
        var {accuracy} = _.last(dataset.sharedConfig.log)
        c.accuracySel.text('Accuracy: ' + d3.format('.1%')(accuracy))
      }
    }

    render()

    return {render}
  }

  return {initLine, initRescalingLine, initHeatmap}
})()

if (window.init) window.init()

