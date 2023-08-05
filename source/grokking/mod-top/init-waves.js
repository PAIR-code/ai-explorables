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


window.initModTopWaves = async function({state, sel, type, xAxisLabel='Input Number', yAxisLabel='Value'}){

  state.dft_max.forEach(col => {
    col.freq = Math.floor((col.max_index - 1)/2)
  })

  var {data, shape} = state[type]

  var byFreq = _.sortBy(d3.nestBy(state.dft_max, d => d.freq), d => +d.key)
  var freqSel = sel.html('').st({paddingTop: 10, paddingBottom: 10}).appendMany('div', byFreq)
    .st({width: 400})
    .each(drawFreqChart)

  function drawFreqChart(freq, chartIndex){
    // if (chartIndex) return
    var sel = d3.select(this)

    var c = d3.conventions({
      sel: sel.append('div'),
      height: 50,
      margin: {left: 25, right: 15, top: 15, bottom: 25}
    })
    c.svg.append('text.chart-title').at({y: -5, fontSize: 12})
      .text(util.titleFmt(type) + ' — Frequency ' + (+freq.key + 1))

    var stepLabelSel = c.svg.append('text.chart-title')
      .at({textAnchor: 'end', x: c.width, y: -5, fontSize: 12, opacity: chartIndex ? 0 : 1})

    c.x.domain([0, state.hyper.n_tokens - 1])
    c.y.domain([-5, 5])

    c.xAxis.ticks(10)
    c.yAxis.tickValues([-5, 0, 5]).tickFormat(d => +d)

    d3.drawAxis(c)
    util.ggPlot(c)
    util.addAxisLabel(c, xAxisLabel, yAxisLabel, 26, -15)


    var valKey = 'inputTokenVals_' + type
    freq.forEach(hiddenDim => {
      hiddenDim[valKey] = d3.range(state.hyper.n_tokens)
    })

    var lineSel = c.svg.appendMany('path.wave-path', freq)
      .at({stroke: '#000', fill: 'none', opacity: .4})
      .on('mouseover', d => {
        state.dim = d.index
        state.renderAll.dim()
      })
      
    c.svg.on('mouseleave', () => {state.dim = -1; state.renderAll.dim() })

    var line = d3.line()
      .x((d, i) => c.x(i))
      .y(c.y)

    var textSel = c.svg.append('g.axis').append('text')
      .st({fill: util.colors.highlight, fontWeight: 800, fontSize: 12})
      .at({x: c.width + 2, dy: '.33em'})

    state.renderAll.step.fns.push(() => {
      stepLabelSel.text((c.width > 200 ? 'Training Step ' : 'Step ') + d3.format('06,')(state.stepIndex*state.hyper.save_every))

      freq.forEach(hiddenDim => {
        var j = hiddenDim.index
        var offset = shape[1]*shape[2]*state.stepIndex

        d3.range(state.hyper.n_tokens).forEach(i => {
          hiddenDim[valKey][i] = data[offset + shape[2]*i + j]
        })
      })

      lineSel.at({d: d => line(d[valKey])})
    })

    state.renderAll.dim?.fns.push(() => {
      lineSel
        .classed('active', 0)
        .filter(d => d.index == state.dim)
        .classed('active', 1)
        .raise()

      var activeFreq = freq.filter(d => d.index == state.dim)[0]

      textSel.text(activeFreq?.index)
      if (!activeFreq) return
    })
  }
}


window.initModTop?.()
