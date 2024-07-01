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

window.initDiff = function (pair) {
  var sel = d3
    .select('.' + pair.class)
    .html('')
    .at({role: 'graphics-document', 'aria-label': pair.ariaLabel})
    .on('keydown', function () {
      sel.classed('changed', 1);
      if (d3.event.keyCode != 13) return;
      d3.event.preventDefault();

      pair.str0 = '';

      updateChart();
    });

  if (!sel.node()) return;

  var isMobile = innerWidth <= 1100;

  var optionSel = sel
    .append('div.options')
    .classed('wide', !isMobile)
    .st({marginBottom: isMobile ? 20 : ''});

  var input0Sel = optionSel
    .append('div.flex-row')
    .append('textarea.input-0')
    .st({marginBottom: 10});
  if (isMobile) {
    input0Sel.on('change', updateChart);
  }

  input0Sel.node().value = pair.s0.replace('[MASK]', '_');

  var countSel = optionSel
    .append('div.option-tokens')
    .append('b')
    .text('Number of Tokens')
    .parent()
    .append('div.flex-row')
    .appendMany('div.button', [30, 200, 1000, 5000, 99999])
    .text((d) => (d > 5000 ? 'All' : d))
    .st({width: 34, textAlign: 'center'})
    .on('click', (d) => {
      pair.count = d;
      updateChart();
    });

  var typeSel = optionSel
    .append('div.option-type')
    .append('b')
    .text('Chart Type')
    .parent()
    .append('div.flex-row')
    .appendMany('div.button', ['Likelihoods', 'Differences'])
    .text((d) => d)
    .st({width: 116, textAlign: 'center'})
    .on('click', (d) => {
      pair.type = d;
      updateChart();
    });

  var modelSel = optionSel
    .append('div.option-model')
    .st({display: 'none'})
    .append('b')
    .text('Model')
    .parent()
    .append('div.flex-row')
    .appendMany('div.button', ['BERT', 'Zari'])
    .text((d) => d)
    .st({width: 116, textAlign: 'center'})
    .on('click', (d) => {
      pair.model = d;
      updateChart();
    });

  var updateSel = optionSel
    .append('div.button.update')
    .on('click', updateChart)
    .text('Update')
    .st({display: isMobile ? 'none' : ''});

  var resetSel = optionSel
    .append('div.reset')
    .html('<span>↻</span> Reset')
    .on('click', () => {
      pair = JSON.parse(pair.pairStr);
      pair.pairStr = JSON.stringify(pair);
      input0Sel.node().value = pair.s0;
      updateChart(true);
    })
    .st({display: 'none'});

  if (pair.alts) {
    d3.select('.' + pair.class + '-alts')
      .html('')
      .classed('alt-block', 1)
      .st({display: 'block'})
      .appendMany('span.p-button-link', pair.alts)
      .html((d) => d.str)
      .on('click', (d) => {
        input0Sel.node().value = d.rawStr;

        updateChart();
      });
  }

  var scatters = [];
  var scatterSel = sel
    .append('div.pair-container-overflow')
    .append('div.pair-container')
    .st({width: 940})
    .appendMany('div', 'p0 p1 c0 p2 p3 c1'.split(' '))
    .each(function (id) {
      var c = d3.conventions({
        sel: d3.select(this).append('div.graph.diff').st({marginTop: -5}),
        height: 250,
        width: 250,
        margin: {bottom: 40, right: 60, top: 5, left: 0},
        layers: 'sdds',
      });

      var [type, i] = id.split('');

      if (type == 'p') {
        c.sel.st({pointer: 'cursor'}).on('click', () => {
          pair.colorByIndex = +i;
          updateChart();
        });
      }

      var nTicks = 4;
      var tickScale = d3.scaleLinear().range([0, c.width]);
      c.svg.appendMany('path.bg-tick', d3.range(nTicks + 1)).at({
        d: (d) =>
          `M ${0.5 + Math.round(tickScale(d / nTicks))} 0 V ${c.height}`,
      });
      c.svg.appendMany('path.bg-tick', d3.range(nTicks + 1)).at({
        d: (d) => `M 0 ${0.5 + Math.round(tickScale(d / nTicks))} H ${c.width}`,
      });

      c.type = type;
      c.scatters = scatters;
      c.scatter = window.initScatter(c);
      c.scatters.push(c.scatter);

      d3.select(this).datum({c, type, i});
    });

  updateChart(true);

  async function updateChart(isFirst) {
    // warningSel.st({opacity: isFirst ? 0 : 1})
    // resetSel.st({opacity: isFirst ? 0 : 1})
    sel.classed('changed', 0);

    countSel.classed('active', (d) => d == pair.count);
    typeSel.classed('active', (d) => d == pair.type);
    modelSel.classed('active', (d) => d == pair.model);

    function getStr(sel) {
      return sel.node().value.replace('_', '[MASK]');
    }

    pair.s0 = input0Sel.node().value.replace('_', '[MASK]');
    var str = pair.s0.replace('[MASK]', '{MASK}');
    var sentences =
      str.split('|').length == 2 ? getZariSenteces() : getTwoPairSentences();

    function getTwoPairSentences() {
      var start = str.split('[')[0];
      var mid = str.split(']')[1].split('[')[0];
      var last = str.split(']')[2];

      var pairA = str.split('[')[1].split(']')[0].split('|');
      var pairB = str.split('[')[2].split(']')[0].split('|');

      return [
        {i: 0, j: 0},
        {i: 0, j: 1},
        {i: 1, j: 0},
        {i: 1, j: 1},
      ].map((word) => {
        var strA = pairA[word.i];
        var strB = pairB[word.j];

        var sentence = [start, strA, mid, strB, last]
          .join('')
          .replace('{MASK}', '[MASK]');

        var modelPath = pair.model == 'Zari' ? 'embed_zari_cda' : 'embed';

        return {word, strA, strB, sentence, modelPath};
      });
    }

    function getZariSenteces() {
      var start = str.split('[')[0];
      var last = str.split(']')[1];
      var pairB = str.split('[')[1].split(']')[0].split('|');

      return [
        {i: 0, j: 0},
        {i: 0, j: 1},
        {i: 1, j: 0},
        {i: 1, j: 1},
      ].map((word) => {
        var strA = word.i ? 'Zari' : 'BERT';
        var strB = pairB[word.j];

        var sentence = [start, strB, last].join('').replace('{MASK}', '[MASK]');

        var modelPath = strA == 'Zari' ? 'embed_zari_cda' : 'embed';

        return {word, strA, strB, sentence, modelPath};
      });
    }

    updateSel.classed('loading', 1);
    // TODO parallel?
    for (var d of sentences) {
      d.maskVals = await post(d.modelPath, {sentence: d.sentence});
    }
    updateSel.classed('loading', 0);

    var allTokens = sentences[0].maskVals.map((v0, i) => {
      var word = tokenizer.vocab[i];
      var v = sentences.map((d) => d.maskVals[i]);

      return {word, i, v, isVisible: false};
    });

    _.sortBy(allTokens, (d) => -d.v[0]).forEach((d, i) => (d.v0i = i));
    _.sortBy(allTokens, (d) => -d.v[1]).forEach((d, i) => (d.v1i = i));
    _.sortBy(allTokens, (d) => -d.v[2]).forEach((d, i) => (d.v2i = i));
    _.sortBy(allTokens, (d) => -d.v[3]).forEach((d, i) => (d.v3i = i));

    allTokens
      .filter(
        (d) =>
          d.v0i <= pair.count ||
          d.v1i <= pair.count ||
          d.v2i <= pair.count ||
          d.v3i <= pair.count,
      )
      .forEach((d) => {
        d.isTop = true;
        d.isVisible = true;
      });

    var pairs = [
      [0, 1],
      [2, 3],

      // [1, 2],
      // [3, 0],

      [0, 2],
      [1, 3],
    ].map((d, i) => {
      var sentA = sentences[d[0]];
      var sentB = sentences[d[1]];

      var allPairTokens = allTokens.map((t, i) => {
        return {word: t.word, v0: t.v[d[0]], i, v1: t.v[d[1]], t};
      });

      allPairTokens.forEach((d) => {
        d.dif = d.v0 - d.v1;
        d.meanV = (d.v0 + d.v1) / 2;
      });
      var i0key = 'v' + d[0] + 'i';
      var i1key = 'v' + d[1] + 'i';

      // TODO should this be done per chart or globally?
      var topTokens = allPairTokens.filter((d) => d.t.isTop);
      // var topTokens = allPairTokens.filter(d => d.t[i0key] <= pair.count || d.t[i1key] <= pair.count)
      var logitExtent = d3.extent(
        topTokens.map((d) => d.v0).concat(topTokens.map((d) => d.v1)),
      );

      var tokens = allPairTokens.filter(
        (d) => logitExtent[0] <= d.v0 && logitExtent[0] <= d.v1,
      );

      var mag = logitExtent[1] - logitExtent[0];
      logitExtent = [
        logitExtent[0] - mag * 0.002,
        logitExtent[1] + mag * 0.002,
      ];

      if (pair.type == 'Differences')
        tokens = _.sortBy(allPairTokens, (d) => -d.meanV).slice(0, pair.count);

      tokens.forEach((d) => {
        d.isVisible = true;
      });

      var maxDif = d3.max(d3.extent(tokens, (d) => d.dif).map(Math.abs));
      var color = palette(-maxDif * 0.5, maxDif * 0.5);

      label0 = sentA.strA + ' / ' + sentA.strB;
      label1 = sentB.strA + ' / ' + sentB.strB;

      return {
        i,
        sentA,
        sentB,
        allPairTokens,
        logitExtent,
        tokens,
        maxDif,
        color,
        label0,
        label1,
      };
    });

    var compares = [
      [0, 1],
      [2, 3],
    ].map((d, i) => {
      var pairA = pairs[d[0]];
      var pairB = pairs[d[1]];

      var allTokensA = pairA.allPairTokens;
      var allTokensB = pairB.allPairTokens;

      var allPairTokens = allTokens.map((t, i) => {
        return {
          word: t.word,
          t,
          difA: allTokensA[i].dif,
          meanA: allTokensA[i].meanV,
          difB: allTokensB[i].dif,
          meanB: allTokensB[i].meanV,
        };
      });

      _.sortBy(allPairTokens, (d) => -d.meanA)
        .slice(0, pair.count)
        .forEach((d) => (d.isVisible = true));

      _.sortBy(allPairTokens, (d) => -d.meanB)
        .slice(0, pair.count)
        .forEach((d) => (d.isVisible = true));

      var tokens = allPairTokens.filter((d) => d.isVisible);

      return {pairA, pairB, tokens, allPairTokens};
    });

    if (!pair.colorByIndex) pair.colorByIndex = 1;
    var color = pairs[pair.colorByIndex].color;
    pairs[pair.colorByIndex].allPairTokens.forEach((d) => {
      d.t.color = color(d.dif);
    });

    scatterSel.each(function ({c, i, type}) {
      updatePairChart(c, type == 'p' ? pairs[i] : compares[i]);
    });
  }

  function updatePairChart(c, p) {
    var {logitExtent, tokens, maxDif, color} = p;
    var allTokens = p.allPairTokens;

    if (c.type == 'c') {
      drawDifDif();
    } else {
      if (pair.type == 'Likelihoods') {
        drawXY();
      } else {
        drawRotated();
      }

      sel.classed('is-xy', pair.type == 'Likelihoods');
      sel.classed('is-rotate', pair.type != 'Likelihoods');
      c.sel.classed('is-color-by', p.i == pair.colorByIndex);
      c.sel.classed('not-is-color-by', p.i != pair.colorByIndex);
    }

    function drawXY() {
      c.x.domain(logitExtent);
      c.y.domain(logitExtent);

      d3.drawAxis(c);

      var s = {30: 4, 200: 3, 1000: 3}[pair.count] || 2;
      var scatterData = allTokens.map((d) => {
        var x = c.x(d.v0);
        var y = c.y(d.v1);
        var fill = d.t.color;
        var dif = d.dif;
        var word = d.word;
        var show = '';
        var isVisible = d.isVisible;

        return {x, y, s, dif, fill, word, show, isVisible};
      });

      var textCandidates = _.sortBy(
        scatterData.filter((d) => d.isVisible),
        (d) => d.dif,
      );
      d3.nestBy(textCandidates.slice(0, 1000), (d) =>
        Math.round(d.y / 10),
      ).forEach((d) => (d[0].show = 'uf'));
      d3.nestBy(textCandidates.reverse().slice(0, 1000), (d) =>
        Math.round(d.y / 10),
      ).forEach((d) => (d[0].show = 'lr'));

      logitExtent.pair = pair;
      c.scatter.draw(c, scatterData, true);
      c.svg
        .selectAppend('text.x-axis-label.xy-only')
        .translate([c.width / 2, c.height + 24])
        .text(p.label0 + ' →')
        .at({fill: util.colors[0], textAnchor: 'middle'});

      c.svg
        .selectAppend('g.y-axis-label.xy-only')
        .translate([c.width + 20, c.height / 2])
        .selectAppend('text')
        .text(p.label1 + ' →')
        .at({
          fill: util.colors[1],
          textAnchor: 'middle',
          transform: 'rotate(-90)',
        });
    }

    function drawRotated() {
      c.x.domain(d3.extent(tokens, (d) => d.meanV));
      c.y.domain([maxDif, -maxDif]);

      d3.drawAxis(c);

      var scatterData = allTokens.map((d) => {
        var x = c.x(d.meanV);
        var y = c.y(d.dif);
        var fill = d.t.color;
        var word = d.word;
        var show = '';
        var isVisible = d.isVisible;

        return {x, y, s: 2, fill, word, show, isVisible};
      });

      scatterData.forEach((d) => {
        d.dx = d.x - c.width / 2;
        d.dy = d.y - c.height / 2;
      });

      var textCandidates = _.sortBy(
        scatterData,
        (d) => -d.dx * d.dx - d.dy * d.dy,
      )
        .filter((d) => d.isVisible)
        .slice(0, 5000);
      d3.nestBy(textCandidates, (d) => Math.round(12 * Math.atan2(d.dx, d.dy)))
        .map((d) => d[0])
        .forEach(
          (d) => (d.show = (d.dy < 0 ? 'u' : 'l') + (d.dx < 0 ? 'l' : 'r')),
        );

      c.scatter.draw(c, scatterData, false);
      c.svg
        .selectAppend('text.rotate-only.x-axis-label')
        .translate([c.width / 2, c.height + 24])
        .text(p.label0 + ' + ' + p.label1 + ' →')
        .at({textAnchor: 'middle'})
        .st({fill: '#000', fontWeight: 300});

      c.svg.select('g.rotate-only.sent-1').html('');

      c.svg
        .selectAppend('g.rotate-only.sent-1')
        .translate([c.width + 20, c.height / 2])
        .append('text')
        .text(p.label1 + ' →')
        .at({textAnchor: 'start', transform: 'rotate(-90)', x: 10})
        .st({fill: util.colors[1]});

      c.svg
        .selectAppend('g.rotate-only.sent-1')
        .translate([c.width + 20, c.height / 2 + 0])
        .append('text')
        .text('← ' + p.label0)
        .at({textAnchor: 'end', transform: 'rotate(-90)', x: -10})
        .st({fill: util.colors[0]});
    }

    function drawDifDif() {
      var maxDifA = d3.max(d3.extent(tokens, (d) => d.difA).map(Math.abs));
      var maxDifB = d3.max(d3.extent(tokens, (d) => d.difB).map(Math.abs));
      var maxDif = d3.max([maxDifA, maxDifB]);

      c.x.domain([maxDif, -maxDif]);
      c.y.domain([maxDif, -maxDif]);

      d3.drawAxis(c);

      var scatterData = allTokens.map((d) => {
        var x = c.x(d.difA);
        var y = c.y(d.difB);
        var fill = d.t.color;
        var word = d.word;
        var show = '';
        var isVisible = d.isVisible;
        return {x, y, s: 2, fill, word, show, isVisible};
      });

      scatterData.forEach((d) => {
        d.dx = d.x - c.width / 2;
        d.dy = d.y - c.height / 2;
      });

      var textCandidates = _.sortBy(
        scatterData.filter((d) => d.isVisible),
        (d) => d.x - d.y,
      );
      d3.nestBy(textCandidates, (d) => Math.round(d.y / 10)).forEach(
        (d) => (d[0].show = 'uf'),
      );
      d3.nestBy(textCandidates.reverse(), (d) => Math.round(d.y / 10)).forEach(
        (d) => (d[0].show = 'lr'),
      );

      c.scatter.draw(c, scatterData, true);

      var isColor = pair.colorByIndex == p.pairA.i;

      var labelSel = c.svg
        .selectAppend('g.sent-0')
        .html('')
        .translate([c.width / 2, c.height + 24]);

      labelSel
        .append('text')
        .text(p.pairA.label1 + ' →')
        .at({textAnchor: 'start', x: 10})
        .st({
          fill: isColor ? util.colors[1] : '#444',
          fontWeight: isColor ? 400 : '',
        });

      labelSel
        .append('text')
        .text('← ' + p.pairA.label0)
        .at({textAnchor: 'end', x: -10})
        .st({
          fill: isColor ? util.colors[0] : '#444',
          fontWeight: isColor ? 400 : '',
        });

      var isColor = pair.colorByIndex == p.pairB.i;

      var labelSel = c.svg
        .selectAppend('g.sent-1')
        .html('')
        .translate([c.width + 20, c.height / 2]);

      labelSel
        .append('text')
        .text(p.pairB.label1 + ' →')
        .at({textAnchor: 'start', transform: 'rotate(-90)', x: 10})
        .st({
          fill: isColor ? util.colors[1] : '#444',
          fontWeight: isColor ? 400 : '',
        });

      labelSel
        .append('text')
        .text('← ' + p.pairB.label0)
        .at({textAnchor: 'end', transform: 'rotate(-90)', x: -10})
        .st({
          fill: isColor ? util.colors[0] : '#444',
          fontWeight: isColor ? 400 : '',
        });
    }
  }
};

if (window.init) init();
