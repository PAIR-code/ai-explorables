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

window.initPair = function (pair) {
  var isMobile = window.innerWidth <= 820;

  var sel = d3
    .select('.' + pair.class)
    .html('')
    .at({role: 'graphics-document', 'aria-label': pair.ariaLabel})
    .on('keydown', function () {
      sel.classed('changed', 1);
      if (d3.event.keyCode != 13) return;
      d3.event.preventDefault();
      // return

      pair.str0 = '';
      pair.str1 = '';

      updateChart();
    });

  if (!sel.node()) return;

  var optionSel = sel.append('div.options');

  var inputRow = optionSel.append('div.flex-row.flex-row-textarea');
  var input1Sel = inputRow
    .append('textarea.input-1')
    .st({color: util.colors[1]})
    .at({cols: 30});
  input1Sel.node().value = pair.s1.replace('[MASK]', '_');

  var input0Sel = inputRow
    .append('textarea.input-0')
    .st({color: util.colors[0]})
    .at({cols: 30});
  input0Sel.node().value = pair.s0.replace('[MASK]', '_');

  if (isMobile) {
    sel.selectAll('textarea').on('change', updateChart);
  }

  var countSel = optionSel
    .append('div')
    .append('b')
    .text('Number of Tokens')
    .append('info')
    .text('ⓘ')
    .call(addLockedTooltip)
    .datum(
      'The scales are set using the top N tokens for each sentence. <br><br>"Likelihoods" will show more than N tokens if a top completion for one sentence is unlikely for the other sentence.',
    )
    .parent()
    .parent()
    .append('div.flex-row')
    .appendMany('div.button', [30, 200, 1000, 5000, 99999])
    .text((d) => (d > 5000 ? 'All' : d))
    .st({textAlign: 'center'})
    .on('click', (d) => {
      pair.count = d;
      updateChart();
    });

  var typeSel = optionSel
    .append('div')
    .append('b')
    .text('Chart Type')
    .append('info')
    .text('ⓘ')
    .call(addLockedTooltip)
    .datum(
      '"Likelihoods" shows the logits from both models plotted directly with a shared linear scale.<br><br> To better contrast the outputs, "Differences" shows <code>logitA - logitB</code> on the y-axis and <code>mean(logitA, logitB)</code> on the x-axis with separate linear scales.',
    )
    .parent()
    .parent()
    .append('div.flex-row')
    .appendMany('div.button', ['Likelihoods', 'Differences'])
    .text((d) => d)
    .st({textAlign: 'center'})
    .on('click', (d) => {
      pair.type = d;
      updateChart();
    });

  var modelSel = optionSel
    .append('div')
    .st({display: pair.model == 'BERT' ? 'none' : ''})
    .append('b')
    .text('Model')
    .parent()
    .append('div.flex-row')
    .appendMany('div.button', ['BERT', 'Zari'])
    .text((d) => d)
    .st({textAlign: 'center'})
    .on('click', (d) => {
      pair.model = d;
      updateChart();
    });

  // TODO add loading spinner
  var updateSel = optionSel
    .append('div.flex-row')
    .append('div.button.update')
    .on('click', updateChart)
    .text('Update')
    .st({display: isMobile ? 'none' : ''});

  var warningSel = optionSel
    .append('div.warning')
    .text(
      '⚠️Some of the text this model was trained on includes harmful stereotypes. This is a tool to uncover these associations—not an endorsement of them.',
    );

  var resetSel = optionSel
    .append('div.reset')
    .html('<span>↻</span> Reset')
    .on('click', () => {
      pair = JSON.parse(pair.pairStr);
      pair.pairStr = JSON.stringify(pair);

      input0Sel.node().value = pair.s0;
      input1Sel.node().value = pair.s1;

      updateChart(true);
    });

  if (pair.alts) {
    d3.select('.' + pair.class + '-alts')
      .html('')
      .classed('alt-block', 1)
      .st({display: 'block'})
      .appendMany('span.p-button-link', pair.alts)
      .html((d) => d.str)
      .on('click', (d) => {
        input0Sel.node().value = d.s0;
        input1Sel.node().value = d.s1;

        updateChart();
      });
  }

  var margin = {bottom: 50, left: 25, top: 5, right: 20};
  var graphSel = sel.append('div.graph');
  var totalWidth = graphSel.node().offsetWidth;
  var width = totalWidth - margin.left - margin.right;

  var c = d3.conventions({
    sel: graphSel.append('div').st({marginTop: isMobile ? 20 : -5}),
    width,
    height: width,
    margin,
    layers: 'sdds',
  });

  var nTicks = 4;
  var tickScale = d3.scaleLinear().range([0, c.width]);
  c.svg.appendMany('path.bg-tick', d3.range(nTicks + 1)).at({
    d: (d) => `M ${0.5 + Math.round(tickScale(d / nTicks))} 0 V ${c.height}`,
  });
  c.svg.appendMany('path.bg-tick', d3.range(nTicks + 1)).at({
    d: (d) => `M 0 ${0.5 + Math.round(tickScale(d / nTicks))} H ${c.width}`,
  });

  var annotationSel = c.layers[1]
    .appendMany('div.annotations', pair.annotations)
    .translate((d) => d.pos)
    .html((d) => d.str)
    .st({color: (d) => d.color, width: 250, postion: 'absolute'});

  var scatter = window.initScatter(c);

  updateChart(true);

  async function updateChart(isFirst) {
    sel.classed('changed', 0);
    warningSel.st({opacity: isFirst ? 0 : 1});
    resetSel.st({opacity: isFirst ? 0 : 1});
    annotationSel.st({opacity: isFirst ? 1 : 0});

    countSel.classed('active', (d) => d == pair.count);
    typeSel.classed('active', (d) => d == pair.type);
    modelSel.classed('active', (d) => d == pair.model);

    function getStr(sel) {
      return sel.node().value.replace('_', '[MASK]');
    }

    var modelPath = pair.model == 'Zari' ? 'embed_zari_cda' : 'embed';

    pair.s0 = input0Sel.node().value.replace('_', '[MASK]');
    pair.s1 = input1Sel.node().value.replace('_', '[MASK]');

    updateSel.classed('loading', 1);
    var vals0 = await post(modelPath, {sentence: pair.s0});
    var vals1 = await post(modelPath, {sentence: pair.s1});
    updateSel.classed('loading', 0);

    var allTokens = vals0.map((v0, i) => {
      return {word: tokenizer.vocab[i], v0, i, v1: vals1[i]};
    });
    allTokens.forEach((d) => {
      d.dif = d.v0 - d.v1;
      d.meanV = (d.v0 + d.v1) / 2;
      d.isVisible = false;
    });

    _.sortBy(allTokens, (d) => -d.v1).forEach((d, i) => (d.v1i = i));
    _.sortBy(allTokens, (d) => -d.v0).forEach((d, i) => (d.v0i = i));

    var topTokens = allTokens.filter(
      (d) => d.v0i <= pair.count || d.v1i <= pair.count,
    );

    var logitExtent = d3.extent(
      topTokens.map((d) => d.v0).concat(topTokens.map((d) => d.v1)),
    );

    var tokens = allTokens.filter(
      (d) => logitExtent[0] <= d.v0 && logitExtent[0] <= d.v1,
    );

    var mag = logitExtent[1] - logitExtent[0];
    logitExtent = [logitExtent[0] - mag * 0.002, logitExtent[1] + mag * 0.002];

    if (pair.type == 'Differences')
      tokens = _.sortBy(allTokens, (d) => -d.meanV).slice(0, pair.count);

    tokens.forEach((d) => {
      d.isVisible = true;
    });

    var maxDif = d3.max(d3.extent(tokens, (d) => d.dif).map(Math.abs));
    var color = palette(-maxDif * 0.8, maxDif * 0.8);

    updateSentenceLabels();

    if (pair.type == 'Likelihoods') {
      drawXY();
    } else {
      drawRotated();
    }

    sel.classed('is-xy', pair.type == 'Likelihoods');
    sel.classed('is-rotate', pair.type != 'Likelihoods');

    function drawXY() {
      c.x.domain(logitExtent);
      c.y.domain(logitExtent);

      d3.drawAxis(c);

      var s = {30: 4, 200: 3, 1000: 3}[pair.count] || 2;
      var scatterData = allTokens.map((d) => {
        var x = c.x(d.v0);
        var y = c.y(d.v1);
        var fill = color(d.dif);
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
      scatter.draw(c, scatterData, true);

      c.svg
        .selectAppend('text.x-axis-label.xy-only')
        .translate([c.width / 2, c.height + 24])
        .text(
          pair.label0
            ? ' __ likelihood, ' + pair.label0 + ' sentence →'
            : '__ likelihood, sentence two →',
        )
        .st({fill: util.colors[0]})
        .at({textAnchor: 'middle'});

      c.svg
        .selectAppend('g.y-axis-label.xy-only')
        .translate([c.width + 20, c.height / 2])
        .selectAppend('text')
        .text(
          pair.label1
            ? ' __ likelihood, ' + pair.label1 + ' sentence →'
            : '__ likelihood, sentence one →',
        )
        .st({fill: util.colors[1]})
        .at({textAnchor: 'middle', transform: 'rotate(-90)'});
    }

    function drawRotated() {
      c.x.domain(d3.extent(tokens, (d) => d.meanV));
      c.y.domain([maxDif, -maxDif]);

      d3.drawAxis(c);

      var scatterData = allTokens.map((d) => {
        var x = c.x(d.meanV);
        var y = c.y(d.dif);
        var fill = color(d.dif);
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

      scatter.draw(c, scatterData, false);

      c.svg
        .selectAppend('text.rotate-only.x-axis-label')
        .translate([c.width / 2, c.height + 24])
        .text('__ likelihood, both sentences →')
        .at({textAnchor: 'middle'})
        .st({fill: '#000'});

      c.svg.selectAll('g.rotate-only.sent-1,g.rotate-only.sent-1').remove();
      c.svg
        .selectAppend('g.rotate-only.sent-1')
        .translate([c.width + 20, c.height / 2])
        .append('text')
        .text(
          `Higher likelihood, ${pair.label1 ? pair.label1 + ' sentence ' : 'sentence one'}  →`,
        )
        .at({textAnchor: 'start', transform: 'rotate(-90)', x: 20})
        .st({fill: util.colors[1]});

      c.svg
        .selectAppend('g.rotate-only.sent-1')
        .translate([c.width + 20, c.height / 2 + 0])
        .append('text')
        .text(
          `← Higher likelihood, ${pair.label0 ? pair.label0 + ' sentence ' : 'sentence two'}`,
        )
        .at({textAnchor: 'end', transform: 'rotate(-90)', x: -20})
        .st({fill: util.colors[0]});
    }
  }

  function updateSentenceLabels() {
    var t0 = tokenizer.tokenize(pair.s0);
    var t1 = tokenizer.tokenize(pair.s1);

    var i = 0;
    while (t0[i] == t1[i] && i < t0.length) i++;

    var j = 1;
    while (t0[t0.length - j] == t1[t1.length - j] && j < t0.length) j++;

    pair.label0 = tokens2origStr(t0, pair.s0);
    pair.label1 = tokens2origStr(t1, pair.s1);

    function tokens2origStr(t, s) {
      var tokenStr = tokenizer.decode(t.slice(i, -j + 1)).trim();
      var lowerStr = s.toLowerCase();

      var startI = lowerStr.indexOf(tokenStr);
      return s.slice(startI, startI + tokenStr.length);
    }

    if (
      !pair.label0.length ||
      !pair.label1.length ||
      pair.label0.length > 15 ||
      pair.label1.length > 15
    ) {
      pair.label0 = '';
      pair.label1 = '';
    }

    // console.log(i, j, pair.label0, pair.label1)
  }
};

if (window.init) init();
