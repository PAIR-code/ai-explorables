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

console.clear()

window.init = function(){
  var initFns = [window.initUtil, window.initScatter, window.initPair]
  if (!initFns.every(d => d)) return

  window.util = initUtil()

  function parseTidy(csvStr, sentences){
    var tidy = d3.csvParse(csvStr, d => {
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
      sent.s0 = sentences[sent.sentenceIndex].s0
      sent.s1 = sentences[sent.sentenceIndex].s1
      sent.orig = sentences[sent.sentenceIndex].orig

      sent.corr = ss.sampleCorrelation(
        sent.map(d => Math.min(d.i0, 300)), 
        sent.map(d => Math.min(d.i1, 300))
      )
      // sent.corr = ss.sampleCorrelation(sent.map(d => d.e0), sent.map(d => d.e1))
    })

    return bySentence
  }

  var bySentenceA = parseTidy(python_data.tidyCSV_A, python_data.sentences_A)
  var bySentenceB = parseTidy(python_data.tidyCSV_B, python_data.sentences_B)
  var bySentence = bySentenceA.map((a, i) => {
    var b = bySentenceB[i]
    var orig = a.orig
      .replace('in 1918, ', '')
      .replace('in texas, ', '')
      .replace('in texas, ', '')

    return {a, b, orig}
  })

  var sel = d3.select('.container').html(`
    <div class='row'>
      <div class='scatter'></div>
      <div class='list'></div>
    </div>
    <div class='row'>
      <div class='pair-a'></div>
      <div class='pair-b'></div>
      <div class='pair-ab'></div>
    </div>
  `)
    .st({width: 1400})
  d3.selectAll('.list,.scatter').st({width: 430, display: 'inline-block', verticalAlign: 'top'})

  d3.selectAll('.pair-a,.pair-b,.pair-ab').st({width: 400, display: 'inline-block', verticalAlign: 'top'})

  function initScatter(bySentence, sel){
    var c = d3.conventions({
      sel: sel.st({width: 350}),
      height: 100,
      width: 300,
      height: 300,
      margin: {left: 40, top: 17, bottom: 60}
    })

    var domain = d3.extent(bySentence.map(d => d.a.corr).concat(bySentence.map(d => d.b.corr))) 


    c.x.domain(domain).nice()
    c.y.domain(domain).nice()
    c.xAxis.ticks(5)
    c.yAxis.ticks(5)
    d3.drawAxis(c)
    c.svg.selectAll('.tick').st({display: 'block'})

    util.ggPlotBg(c)
    util.addAxisLabel(c, 
      python_data.slug_A + ' coefficients (avg ' + util.corrFmt(d3.mean(bySentence, d => d.a.corr)) + ')', 
      python_data.slug_B + ' coefficients (avg ' + util.corrFmt(d3.mean(bySentence, d => d.b.corr)) + ')', 
      )


    c.svg.append('path').at({d: `M 0 ${c.height} L ${c.width} 0`, stroke: '#fff', strokeWidth: 2})

    c.svg.appendMany('circle.sentence', bySentence)
      .translate(d => [c.x(d.a.corr), c.y(d.b.corr)])
      .at({
        r: 3,
        fill: 'none',
        stroke: '#000'
      })
      .on('mouseover', setSentenceAsPair)
  }
  initScatter(bySentence, d3.select('.scatter'))


  function initList(bySentence, sel){
    var tableSel = sel
      .st({height: 300 + 17, overflowY: 'scroll', cursor: 'default', position: 'relative'})
      .append('table')
      .st({fontSize: 12})

    tableSel.append('tr.header')
      .html(`
        <th class='num'>${python_data.slug_A}</th>
        <th class='num'>${python_data.slug_B}</th>
        <th>template</th>
      `)

    var rowSel = tableSel
      .appendMany('tr.sentence', _.sortBy(bySentence, d => d.a.corr))
      .on('mouseover', setSentenceAsPair)
      .st({padding: 2, fontSize: 12})
      .html(d => `
        <td class='num'>${util.corrFmt(d.a.corr)}</td>
        <td class='num'>${util.corrFmt(d.b.corr)}</td>
        <td>${d.orig.replace('[', '').replace(']', '')}</td>
      `)

  }
  initList(bySentence, d3.select('.list'))


  function setSentenceAsPair(s){
    function drawScatter(type){
      var st = s
      if (type.length == 2){
        st.e0 = s.a.e0.map((e0, i) => e0 - s.a.e1[i])
        st.e1 = s.b.e0.map((e0, i) => e0 - s.b.e1[i])

        st.label0 = python_data.slug_A + ' dif'
        st.label1 = python_data.slug_B + ' dif'
        st.isDifference = false
        st.count = (python_settings.count || 150)*2
      } else {
        st = s[type]
        st.e0 = d3.range(python_data.vocab.length).map(d => -Infinity)
        st.e1 = d3.range(python_data.vocab.length).map(d => -Infinity)
        st.forEach(d => {
          st.e0[d.tokenIndex] = d.e0
          st.e1[d.tokenIndex] = d.e1
        })

        st.label0 = st.s0
        st.label1 = st.s1
      
        st.isDifference = python_settings.isDifference
        st.count = python_settings.count || 150

        st.topLabel = type == 'a' ? python_data.slug_A : python_data.slug_B
      }
      
      st.vocab = python_data.vocab

      var sel = d3.select('.pair-' + type).html('').st({width: 400, marginRight: 40})
      initPair(st, sel.append('div'))
    }
    drawScatter('b')
    drawScatter('a')
    drawScatter('ab')

    d3.selectAll('.sentence').classed('active', d => d == s)

    d3.selectAll('tr.sentence').filter(d => d == s)
      .each(function(){
        this.scrollIntoView({ block: 'nearest', inline: 'nearest'})
      })
  }
  setSentenceAsPair(bySentence[0])

}



window.init()

