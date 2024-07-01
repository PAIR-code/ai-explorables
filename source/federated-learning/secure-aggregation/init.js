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

var r = 100;
var blockWidth = 120;
var blockHeight = 30;

var diagramIndex = 0;

var nums = {
  a: {v: 5},
  b: {v: 4},
  c: {v: 8},
  ab: {v: 2},
  bc: {v: 7},
  ca: {v: 3},

  s: {v: 0},
  ssa: {v: 0},
  ssb: {v: 0},
  ssc: {v: 0},
};

var colorScale = d3.scaleOrdinal().range(['#24773d', '#a19406', '#6d4a04']);
d3.entries(nums).forEach((d) => {
  d.value.key = d.key;

  d.value.color =
    d.key.length == 1 ? '#000' : d.key.length == 3 ? '#999' : colorScale(d.key);
  // if (d.key == 's') d.value.color = '#999'
});

var sel = d3
  .select('.secure-aggregation')
  .html('')
  .append('div.block-title')
  .text('Secure Aggregation: How Does It Work?')
  .st({marginBottom: 10})
  .parent()
  .append('div.container');

sel.appendMany('div', d3.range(3)).each(drawDiagram);

!(function () {
  var scale = d3.scaleLinear().domain([-40, 40]).range([-30, 30]); //.clamp(1)

  var isDragging = false;
  var drag = d3
    .drag()
    .subject((d) => ({x: scale.invert(d.n.v), y: 0}))
    .on('drag', (d) => {
      d.n.v = Math.round(scale(d3.event.x)) % 100;
      syncNums();
    })
    .on('start', (d) => {
      sel.classed('is-dragging', 1);
      isDragging = true;
    })
    .on('end', () => {
      sel.classed('is-dragging', 0);
      isDragging = false;
      setHovered(0);
    });

  var numSel = sel
    .selectAll('.num')
    .call(drag)
    // .st({cursor: 'ew-resize', pointerEvents: d => d.n.key.includes('s') ? 'none' : ''})
    .st({
      cursor: 'ew-resize',
      pointerEvents: (d) =>
        d.n.key.includes('s') || d.n.key.length == 1 ? 'none' : '',
    });

  function syncNums() {
    var n = nums;
    n.s.v = n.a.v + n.b.v + n.c.v;

    n.ssa.v = n.a.v + n.ab.v - n.ca.v;
    n.ssb.v = n.b.v + n.bc.v - n.ab.v;
    n.ssc.v = n.c.v + n.ca.v - n.bc.v;

    numSel.text((d) => d3.format('+')(d.n.v * (d.sign || 1)));
  }
  syncNums();

  numSel.on('mouseover', setHovered).on('mouseout', () => setHovered(0));

  function setHovered(d) {
    if (isDragging) return;
    if (!d) return numSel.classed('hovered', 0);

    numSel.classed('hovered', (e) => {
      if (e.isCaption) return false;
      if (e.n.key == d.n.key) return true;
      if (e.n.key == 's') return true;
      if (e.n.key[2] && d.n.key.includes(e.n.key[2])) return true;
    });
  }
})();

function drawDiagram(diagramIndex) {
  var people = ['Alice', 'Bob', 'Carol', 'Server'].map((name, personIndex) => {
    var sin30 = Math.pow(3, 1 / 2) / 2;
    var cos30 = 0.5;

    var pos = [
      [0, -r - 20],
      [-r * sin30, +r * cos30],
      [+r * sin30, +r * cos30],
      [0, -20],
    ].map((d) => [d[0] - 4 + r, d[1] + r])[personIndex];

    var centerPos = [pos[0] + blockWidth / 2, pos[1] + blockHeight / 2];

    var slug = name[0].toLowerCase();

    var activeNums = [];
    if (slug == 's') {
      activeNums = [nums.s];
    } else {
      if (diagramIndex == 0) {
        activeNums = [nums[slug]];
      } else {
        activeNums = [
          [nums.ab, nums.a, nums.ca],
          [nums.ab, nums.b, nums.bc],
          [nums.bc, nums.c, nums.ca],
        ][personIndex];
      }
    }

    activeNums = activeNums.map((n) => {
      return {n, sign: slug == n.key[0] ? 1 : -1, personIndex};
    });

    return {name, slug, pos, centerPos, personIndex, activeNums};
  });

  if (diagramIndex < 2) people = people.filter((d) => d.personIndex < 3);

  var c = d3.conventions({
    sel: d3.select(this).append('div.diagram-container'),
    width: r * 2,
    height: r * 2,
    layers: 'sd',
    margin: {left: 0, top: 30 + 20, bottom: 15, right: 110},
  });
  c.rootsvg = c.sel.select('svg').append('g');

  c.svg.append('rect');
  // .at({width: c.totalWidth, height: c.totalHeight, x: -c.margin.left, y: -c.margin.top, fill: '#f3f3f3'})
  var divSel = c.layers[1];
  var peopleSel = divSel
    .appendMany('div', people)
    .st({position: 'absolute', width: blockWidth})
    .translate((d) => d.pos);

  var nameSel = peopleSel
    .append('div')
    .st({
      textAlign: 'center',
      position: 'absolute',
      width: blockWidth,
      top: (d) => (d.personIndex == 0 ? -20 : 17 + 10),
    })
    .text((d) => d.name);

  var blockSel = peopleSel.append('div.num-container');

  var numSel = blockSel
    .appendMany('span.num', (d) => d.activeNums)
    .st({color: '#fff', background: (d) => d.n.color});

  numSel
    .filter((d) => d.n.key == 's')
    .st({color: '#000', background: '#fff', outline: '1px solid #000'});

  var peopleSvgSel = c.svg
    .appendMany('g', people)
    .translate((d) => d.centerPos);

  if (diagramIndex == 1) {
    ['ab', 'bc', 'ca'].forEach((pairStr, pairIndex) => {
      var pairNodes = [];
      numSel
        .filter((d) => d.n.key == pairStr)
        .each(function (d) {
          pairNodes.push(this);
        });

      if (
        d3.select(pairNodes[0]).datum().personIndex <
        d3.select(pairNodes[1]).datum().personIndex
      )
        pairNodes.reverse();

      var stroke = colorScale(pairStr);
      if (pairIndex == 1) {
        midToMid(pairNodes[0], pairNodes[1], {stroke, y0: 3, y1: 3});
        midToMid(pairNodes[1], pairNodes[0], {stroke, y0: -3, y1: -3});
      } else {
        midToMid(pairNodes[0], pairNodes[1], {
          stroke,
          x0: pairIndex ? -2 : -2,
          x1: 5,
        });
        midToMid(pairNodes[1], pairNodes[0], {stroke, x0: -5, x1: -5});
      }
    });
  }

  if (diagramIndex == 2) {
    var localSumSel = blockSel
      .filter((d) => d.personIndex < 3)
      .append('span.num')
      .st({top: (d) => (d.personIndex == 0 ? 10 : -10 - 40)})
      .datum((d) => ({n: nums['ss' + d.slug], sign: 1, person: d}))
      .st({
        color: '#fff',
        background: (d) => `linear-gradient(to right, 
          ${d.person.activeNums[0].n.color} 0%, ${d.person.activeNums[0].n.color} 20%, 
          ${d.person.activeNums[1].n.color} 40%, ${d.person.activeNums[1].n.color} 60%, 
          ${d.person.activeNums[2].n.color} 80%, ${d.person.activeNums[2].n.color} 100%)`,
      });

    localSumSel.each(function (d, i) {
      var offset = {x1: 4, strokeDasharray: '10 0'};
      midToMid(numSel._groups[i][0], this, offset);
      midToMid(numSel._groups[i][1], this, offset);
      midToMid(numSel._groups[i][2], this, offset);

      offset.strokeDasharray = '';
      midToMid(this, numSel.filter((d) => d.personIndex == 3).node(), offset);
    });
  }

  peopleSel.each(function (d) {
    var aBox = this.getBoundingClientRect();
    var pBox = c.sel.node().getBoundingClientRect();

    var x = aBox.x - pBox.x;
    var y = aBox.y - pBox.y;
    var width = aBox.width;

    var rectSel = c.svg
      .append('rect')
      .lower()
      .at({x, y, height: 70, width})
      .at({fill: '#eee', rx: 20, ry: 20})
      .translate(-65, 1);

    if (d.personIndex == 0) {
      rectSel.translate(-70, 1);
    }

    if (d.personIndex == 3) {
      rectSel.at({x: x + 50 / 2, width: width - 50, opacity: 0});
    }

    // .st({position: 'absolute', background: '#eee', width: '100%', borderRadius: 10,  height: 65, top: -15})
    // .each(d => {
    //   if (d.personIndex == 2) d3.select(this).st({})
    //   if (d.personIndex == 3) d3.select(this).st({})
    // })
  });

  function midToMid(a, b, options = {}) {
    var aBox = a.getBoundingClientRect();
    var bBox = b.getBoundingClientRect();
    var pBox = c.sel.node().getBoundingClientRect();

    var [x0, x1] = [aBox.x + aBox.width / 2, bBox.x + bBox.height / 2].map(
      (d) => d - pBox.x,
    );
    var [y0, y1] = [aBox.y + aBox.height / 2, bBox.y + bBox.height / 2].map(
      (d) => d - pBox.y,
    );

    if (options.x0) x0 = x0 + options.x0;
    if (options.y0) y0 = y0 + options.y0;
    if (options.x1) x1 = x1 + options.x1;
    if (options.y1) y1 = y1 + options.y1;

    c.rootsvg
      .append('path.dotted-path')
      .at({
        d: `M ${[x0, y0]} L ${[x1, y1]}`,
        stroke: options.stroke || '#888',
        strokeWidth: options.strokeDasharray ? '' : 3,
        fill: 'none',
      })
      .st({strokeDasharray: options.strokeDasharray});
    // c.rootsvg.append('circle')
    //   .at({r: 4, cx: x1, cy: y1, fill: '#888'})
  }

  function topMidToMid(a, b, offsets = {}) {
    var aBox = a.getBoundingClientRect();
    var bBox = b.getBoundingClientRect();
    var pBox = c.sel.node().getBoundingClientRect();

    var [x0, x1] = [aBox.x + aBox.width / 2, bBox.x + bBox.height / 2].map(
      (d) => d - pBox.x,
    );
    var [y0, y1] = [aBox.y + aBox.height * 0, bBox.y + bBox.height * 0].map(
      (d) => d - pBox.y,
    );

    if (offsets.x0) x0 = x0 + offsets.x0;
    if (offsets.y0) y0 = y0 + offsets.y0;
    if (offsets.x1) x1 = x1 + offsets.x1;
    if (offsets.y1) y1 = y1 + offsets.y1;

    var path = offsets.flipCurve
      ? `M ${[x0, y0]} C ${[x0, y1, x1, y0, x1, y1]}`
      : `M ${[x0, y0]} C ${[x1, y0, x0, y1, x1, y1]}`;

    c.rootsvg
      .append('path.dotted-path')
      .at({
        d: path,
        stroke: '#888',
        fill: 'none',
      })
      .st({strokeDasharray: options.strokeDasharray});

    // c.rootsvg.append('circle')
    //   .at({r: 4, cx: x1, cy: y1, fill: '#888'})
  }

  // `Alice, Bob and Carol want to find the sum of all their <hn>hidden numbers</hn>.
  // <br><br>
  // Without revealing <hn></hn>, <hn></hn> or <hn></hn> to anyone else, how can they calculate <total></total>?

  var captions = [
    `
    Alice, Bob and Carol want to find the sum of all their <hn>hidden numbers</hn>
    <br><br>
    How can they calculate the answer of <total-container></total-container> without anyone revealing their number?
    `,

    `First, Alice & Bob meet in private and pick a <hn style='background:${colorScale(0)}'>shared random number</hn>. Alice saves the random number and Bob saves the random number with the sign flipped. 
    <br><br>
    <hn style='background:${colorScale(1)}'>Bob & Carol</hn> and <hn style='background:${colorScale(2)}'>Carol & Alice</hn> do the same.`,

    `Next, everyone adds up their hidden number and shared random numbers. Then they send the result to a central server. 
    <br><br>
    Finally, the server sums up all results. The pairs of shared random numbers cancel out and the <total>total</total> of the hidden numbers is left over.`,
  ];

  var captionSel = c.sel
    .parent()
    .st({width: c.totalWidth})
    .append('div.caption')
    .html(captions[diagramIndex]);

  if (diagramIndex == 0) {
    // captionSel.selectAll('hn')
    //   .filter((d, i) => i)
    //   .data('abc'.split('').map(d => ({n: nums[d]})))
    //   .classed('num', 1)

    captionSel
      .selectAll('total-container')
      .append('total')
      .data('s'.split('').map((d) => ({n: nums[d], isCaption: true})))
      .classed('num', 1);
  }
}
