/* Copyright 2021 Google LLC. All Rights Reserved.

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


// console.clear()

window.init = function(){
  var initFns = [window.initUtil, window.initScatter, window.initPair]
  if (!initFns.every(d => d)) return

  window.util = initUtil()

  window.tidy = d3.csvParse(python_data.tidyCSV, d => {
    return {
      e0: +d.e0,
      e1: +d.e1,
      i0: +d.i0,
      i1: +d.i1,
      tokenIndex: +d.tokenIndex,
      sentenceIndex: +d.sentenceIndex,
    }
  })

  var bySentence = d3.nestBy(tidy, d => d.sentenceIndex)
  bySentence.forEach(sent => {
    sent.sentenceIndex = +sent.key
    sent.s0 = python_data.sentences[sent.sentenceIndex].s0
    sent.s1 = python_data.sentences[sent.sentenceIndex].s1
    sent.orig = python_data.sentences[sent.sentenceIndex].orig

    sent.corrA = ss.sampleCorrelation(sent.map(d => d.i0), sent.map(d => d.i1))
    // sent.corrA = ss.sampleCorrelation(sent.map(d => d.e0), sent.map(d => d.e1))
  })

  var sel = d3.select('.container').html(`
    <div class='left'>
      <div class='beeswarm'></div>
      <div class='pair'></div>
    </div>
    <div class='right'>
      <div class='list'></div>
    </div>
  `)
    .st({width: 1100})
  d3.selectAll('.left,.right').st({width: 500, display: 'inline-block', verticalAlign: 'top'})

  function initBeeswarm(bySentence, sel){
    var c = d3.conventions({
      sel: sel.append('div'),
      height: 80,
      totalWidth: 400,
      margin: {left: 0, top: 18}
    })

    c.x.domain(d3.extent(bySentence.map(d => +d.corrA))).nice()
    // c.x.domain([0, 1])
    c.xAxis.ticks(5)
    d3.drawAxis(c)
    util.ggPlotBg(c)
    c.svg.select('.y').remove()
    c.svg.selectAll('.tick').st({display: 'block'})

    var simulation = d3.forceSimulation(bySentence)
      .force("x", d3.forceX(d => c.x(d.corrA)).strength(1))
      .force("y", d3.forceY(c.height / 2))
      .force("collide", d3.forceCollide(4))
      .stop()

    for (var i = 0; i < 120; ++i) simulation.tick()

    c.svg.append('text').text('text')
      .text('Distribution of Spearman Correlation Coefficients')
      .at({dy: -5, fontWeight: 600})

    c.svg.appendMany('circle.sentence', bySentence)
      .translate(d => [d.x, d.y])
      .at({
        r: 3,
        fill: 'none',
        stroke: '#000'
      })
      .on('mouseover', setSentenceAsPair)
  }
  initBeeswarm(bySentence, d3.select('.beeswarm'))


  function initList(bySentence, sel){
    // var sentenceSel = sel.st({height: 500, overflowY: 'scroll', cursor: 'default'})
    //   .appendMany('div.sentence', _.sortBy(bySentence, d => d.corrA))
    //   .on('mouseover', setSentenceAsPair)
    //   .st({padding: 2, fontSize: 12})

    // sentenceSel.append('span')
    //   .text(d => (d3.format('+.2f')(d.corrA)).replace('0.', '.'))
    //   .st({marginRight: 10, color: '#aaa'})

    // sentenceSel.append('span')
    //   .text(d => d.orig.replace('[', '').replace(']', ''))

    var tableSel = sel
      .st({height: 470 + 17, overflowY: 'scroll', cursor: 'default', position: 'relative', left: -40})
      .append('table')
      .st({fontSize: 12})

    tableSel.append('tr.header')
      .html(`
        <th class='num'>corr</th>
        <th>template</th>
      `)

    var rowSel = tableSel
      .appendMany('tr.sentence', _.sortBy(bySentence, d => d.corrA))
      .on('mouseover', setSentenceAsPair)
      .st({padding: 2, fontSize: 12})
      .html(d => `
        <td class='num'>${(d3.format('+.2f')(d.corrA)).replace('0.', '.')}</td>
        <td>${d.orig.replace('[', '').replace(']', '')}</td>
      `)
  }
  initList(bySentence, d3.select('.list'))



  function setSentenceAsPair(s){
    s.e0 = d3.range(python_data.vocab.length).map(d => -Infinity)
    s.e1 = d3.range(python_data.vocab.length).map(d => -Infinity)
    s.forEach(d => {
      s.e0[d.tokenIndex] = d.e0
      s.e1[d.tokenIndex] = d.e1
    })

    s.label0 = s.s0
    s.label1 = s.s1
    s.vocab = python_data.vocab
    s.count = python_settings.count || 150
    s.isDifference = python_settings.isDifference

    var sel = d3.select('.pair').html('').st({width: 400})

    initPair(s, sel)

    d3.selectAll('.sentence').classed('active', d => d == s)

    d3.selectAll('div.sentence').filter(d => d == s)
      .each(function(){
        this.scrollIntoView({ block: 'nearest', inline: 'nearest'})
      })
  }

  setSentenceAsPair(bySentence[0])

}


window.init()

