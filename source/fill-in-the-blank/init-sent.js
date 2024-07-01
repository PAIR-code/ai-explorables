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

window.initSent = async function (sent, sel) {
  var isHamlet = sent.class == 'hamlet';
  var isMobile = innerWidth < 900;

  var sel = d3
    .select('.' + sent.class)
    .st({opacity: 0.5, marginBottom: isHamlet ? '' : 40});

  // Load completitions
  var str = sent.str;
  while (str.includes('__')) str = str.replace('__', '_');
  str = str.replace('_', 'things');

  var tokens = tokenizer.tokenizeCLS(str).filter((d) => d < 30522);

  var topTokens = await post('embed_group_top', {tokens});
  topTokens.forEach((sent) => {
    sent.forEach((d) => (d.str = tokenizer.vocab[d.i]));
  });

  var displayTokens = tokens.slice(1).map((vocabIndex, i) => {
    return {i, str: bertLargeVocab[vocabIndex].replace('##', '')};
  });
  displayTokens.pop();

  sel.html('').st({opacity: 1});
  if (!sel.node()) return;

  var divSel = sel.append('div').st({position: 'relative'});
  var svgSel = divSel
    .append('svg')
    .st({position: 'absolute', top: 0, zIndex: -10});

  var tokenSel = divSel
    .append('div.token-container')
    .st({padding: 20, paddingLeft: 0, paddingRight: 0, fontSize: 20})
    .appendMany('button.token', displayTokens)
    .text((d) => d.str)
    .on('click', drawToken);

  var connectionPath = svgSel
    .append('path')
    .at({fill: 'none', stroke: '#000', strokeWidth: 1});

  var padding = 5;
  var width = divSel.node().offsetWidth;
  var botWidth = isMobile ? width - padding * 2 : 580;

  var botTextSel = divSel
    .append('div.top-sents')
    .translate([width / 2 - botWidth / 2 - padding + 0.5, 15])
    .st({
      width: botWidth,
      height: 170,
      outline: '1px solid #000',
      padding: padding,
      // position: 'absolute',
      background: '#fff',
      overflowY: 'scroll',
      fontSize: isMobile ? 10 : '',
    });

  if (isHamlet) {
    divSel
      .append('div.caption')
      .text(`BERT's predictions for what should fill in the hidden word`)
      .st({
        fontWeight: '',
        lineHeight: '1.1em',
        fontSize: 14,
        textAlign: 'center',
        width: '100%',
        marginTop: 20,
      });
  }

  var curIndex = -1;
  function drawToken(token) {
    var node = tokenSel.filter((d) => d == token).node();
    var x = node.offsetLeft + node.offsetWidth / 2;
    var y = node.offsetTop + node.offsetHeight;

    var y1 = botTextSel.node().offsetTop;

    connectionPath.at({d: ['M', x, y, 'L', width / 2, y1 + 15].join(' ')});

    var completionSel = botTextSel
      .html('')
      .appendMany('span', topTokens[token.i + 1])
      .st({
        display: 'inline-block',
        fontFamily: 'monospace',
        width: isMobile ? '47%' : '31%',
        borderBottom: '1px solid #ccc',
        margin: 4,
        fontSize: innerWidth < 350 ? 12 : isMobile ? 13 : 14,
      });

    completionSel
      .append('span')
      .st({color: '#ccc'})
      .html((d) => {
        var str = d3.format('.3f')(d.p * 100) + '% ';
        if (str.length < 8) str = '&nbsp;' + str;
        return str;
      });

    completionSel.append('span').text((d) => d.str.replace('▁', ''));

    tokenSel
      .text((d) => d.str)
      .classed('active', false)
      .filter((d) => d == token)
      .classed('active', true)
      .text((d) =>
        d.str
          .split('')
          .map((d) => '_')
          .join(''),
      );
  }

  var i = displayTokens.length - (isHamlet ? 2 : 2);
  if (tokens.includes(2477)) i = tokens.indexOf(2477) - 1;
  drawToken(displayTokens[i]);

  var topTokensSel = sel.append('div.top-tokens');
};

if (window.init) init();
