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

window.initGenderOverTime = async () => {
  if (!window.genderOverTimeData) {
    window.genderOverTimeData = await (
      await fetch('data/gender-over-time.json')
    ).json();
  }

  var isMobile = innerWidth <= 1100;

  var sentences = window.genderOverTimeData;

  var blocks = [
    {
      text: 'placeholder',
      sentences: sentences.slice(0, 3),
      ariaLabel:
        'Gendered difference in predicted occupations, studies and names are smalled with a "in 2000" prefix than with a "in 1860" prefix.',
    },
    {
      text: 'placeholder',
      sentences: [sentences[3], sentences[5], sentences[4]],
      ariaLabel: 'Gendered difference in game play and bears do not decrease.',
    },
  ];

  var blockSel = d3
    .selectAll('.gender-over-time')
    .html('')
    .data(blocks)
    .st({marginBottom: 30, marginTop: 30})
    .at({role: 'graphics-document', 'aria-label': (d) => d.ariaLabel});

  var sentenceSel = blockSel
    .appendMany('div.sentence', (d) => d.sentences)
    .st({display: 'inline-block'})
    .each(drawSentence);

  blockSel.filter((d, i) => !i).append('div.g-caption').html(`
    The top 150 “he” and “she” completions in years from 1860-2018 are shown
    with the y position encoding he_logit - she_logit.
    <a href="https://colab.research.google.com/github/PAIR-code/ai-explorables/blob/master/server-side/fill-in-the-blank/gender-over-time-colab/gender-over-time.ipynb">Run in Colab →</a>`);

  async function drawSentence({s0, s1, tidyCSV, minYear}, i) {
    var tidy = d3.csvParse(tidyCSV);
    var {colors} = util;

    tidy.forEach((d) => {
      d.year = minYear + +d.year_index;
      d.i = +d.token_index;
      d.e0 = +d.e0;
      d.e1 = +d.e1;
      d.mean = d.e0 + d.e1;
      d.dif = d.e0 - d.e1;
    });

    var sel = d3.select(this);

    function fmtStr(d) {
      return d
        .replace('[MASK]', '___')
        .replace('YEAR', '$year')
        .replace(' he ', ' <b>he</b> ')
        .replace(' she ', ' <b>she</b> ')
        .replace(' his ', ' <b>his</b> ')
        .replace(' her ', ' <b>her</b> ')
        .replace(' they ', ' <b>they</b> ');
    }
    sel.classed('is-bear', (d) => s0.includes('bear'));

    var c0 = s0.includes('they') ? colors[2] : colors[0];
    var c1 = s1.includes('they') ? colors[2] : colors[1];

    sel.append('div.sentence-title').st({color: c0}).html(fmtStr(s0));
    sel.append('div.sentence-title').st({color: c1}).html(fmtStr(s1));

    var e0Extent = d3.extent(tidy, (d) => d.e0);
    var e1Extent = d3.extent(tidy, (d) => d.e1);
    var e0e1Exent = d3.extent(e0Extent.concat(e1Extent));

    var maxDif = d3.max(
      d3.extent(tidy, (d) => d.dif),
      Math.abs,
    );
    var difExtent = [-maxDif, maxDif];

    drawDim(tidy, sel, {
      key: 'dif',
      yExtent: difExtent,
      rectColor: [c0, c1],
    });
    // drawDim(tidy, sel, {
    //   key: 'e0',
    //   yExtent: e0e1Exent,
    //   rectColor: [colors[0], colors[0]]
    // })
    // drawDim(tidy, sel, {
    //   key: 'e1',
    //   yExtent: e0e1Exent,
    //   rectColor: [colors[1], colors[1]]
    // })
  }

  function drawDim(tidy, sel, {key, rectColor, yExtent}) {
    var c = d3.conventions({
      sel: sel.append('div'),
      height: 240,
      // width: 240,
      margin: {left: 20, bottom: 20, right: 80, top: 5},
    });

    c.svg.append('rect').at({
      width: c.width,
      height: c.height / 2,
      opacity: 0.1,
      fill: rectColor[0],
    });

    c.svg.append('rect').at({
      width: c.width,
      height: c.height / 2,
      opacity: 0.1,
      fill: rectColor[1],
      y: c.height / 2,
    });

    c.x.domain(d3.extent(tidy, (d) => d.year)).interpolate(d3.interpolateRound);
    c.y.domain(yExtent).interpolate(d3.interpolateRound);

    c.xAxis.tickFormat((d) => d).ticks(5);
    c.yAxis.ticks(c.y.ticks(2).length > 2 ? 2 : 3).tickFormat(d3.format('+'));
    d3.drawAxis(c);
    // c.svg.select('.y .tick text').st({fill: d => !d ? '' : rectColor[d < 0 ? 0 : 1]})

    var byToken = d3.nestBy(tidy, (d) => d.i);
    byToken.forEach((d) => {
      d.endY = c.y(_.last(d)[key]);
      d.str = bertLargeVocab[+d.key].replace('▁', '');
      d.displayLabel = true;
      d.mean = d3.sum(d, (e) => e.mean);
      d.keyMean = d3.sum(d, (e) => e[key]);
    });

    d3.nestBy(
      _.sortBy(byToken, (d) => -d.mean),
      (d) => Math.round(d.endY / 12),
    ).forEach((d) => d.forEach((e, i) => (e.displayLabel = !i)));

    var line = d3
      .line()
      .x((d) => c.x(d.year))
      .y((d) => c.y(d[key]));

    var tokenSel = c.svg
      .appendMany('g.time-token', byToken)
      // .call(d3.attachTooltip)
      .on('mouseover', function (d) {
        d3.selectAll('g.time-token')
          .classed('active', 0)
          .filter((e) => e.str == d.str)
          .classed('active', 1)
          .raise();
      });

    c.svg.on('mouseleave', function () {
      d3.selectAll('g.time-token').classed('active', 0);
    });

    tokenSel
      .append('text')
      .text((d) => d.str)
      .translate((d) => [c.width + 2, d.endY])
      .at({
        fontSize: 10,
        dy: '.33em',
        fill: (d, i) => (d.displayLabel ? '#999' : 'rgba(0,0,0,0)'),
      });

    tokenSel.append('path').at({
      d: line,
      stroke: '#000',
      opacity: 0.2,
      fill: 'none',
    });
  }
};

if (window.init) window.init();
