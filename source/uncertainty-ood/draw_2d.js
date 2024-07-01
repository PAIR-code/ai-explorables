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

window.draw_2d = async function () {
  // TODO: share colors across components?
  var colors2d = [d3.interpolateTurbo(0.15), d3.interpolateTurbo(0.85)];
  var renderFns = [];
  renderFns.renderAll = () => renderFns.forEach((d) => d());

  var state = {
    numTop: 10,
  };

  var randomNormal = d3.randomNormal.source(new Math.seedrandom(6));
  window.points = d3.range(24).map((i) => {
    var color = i % 2 ? 0 : 1;

    var σ = 0.1;
    var μ = 0.3;
    // TODO: scale σ based on x and y dim
    if (color) {
      var x = randomNormal(1 - μ, σ / 4)();
      var y = randomNormal(1 - μ, σ)();
    } else {
      var x = randomNormal(μ, σ / 4)();
      var y = randomNormal(μ, σ)();
    }

    x = d3.clamp(0.05, x, 1 - 0.05);
    y = d3.clamp(0.05, y, 1 - 0.05);

    return {i, x, y, color};
  });

  function transitionSlider(numTopFinal) {
    var i = d3.interpolate(state.numTop, numTopFinal);
    var totalTime = 1500;
    window.__timer?.stop();
    window.__timer = d3.timer((s) => {
      if (s > totalTime) window.__timer?.stop();

      var t = d3.clamp(0, s / totalTime, 1);
      state.numTop = Math.round(i(t));
      renderFns.renderAll();
    });
  }

  function moveBlue() {
    var bluePoints = points.filter((d) => !d.color);

    // move back to the left if all the points have moved
    if (bluePoints.every((d) => d.moved)) {
      points.forEach((d) => (d.moved = false));
      moveBlue.isRightDirection = !moveBlue.isRightDirection;
    }

    var point = _.sortBy(
      bluePoints.filter((d) => !d.moved),
      (d) => (moveBlue.isRightDirection ? d.x : -d.x),
    )[0];
    var newPos = [
      (moveBlue.isRightDirection ? 0.85 : 0.05) + Math.random() * 0.1,
      0.01 + Math.random() * 0.2,
    ];

    point.moved = true;
    var i = d3.interpolate([point.x, point.y], newPos);
    moveBlue.activePoint = point;

    var totalTime = 1500;
    var timer = d3.timer((s) => {
      if (s > totalTime) timer.stop();
      var t = d3.clamp(0, d3.easeCubicInOut(s / totalTime), 1);
      // console.log(t)

      point.x = i(t)[0];
      point.y = i(t)[1];
      if (moveBlue.activePoint == point) renderFns.renderAll();
    });
  }
  moveBlue.isRightDirection = true;

  d3.selectAll('span.button').on('click', function () {
    var text = d3.select(this).text().toLowerCase().trim();

    if (text == 'single model') transitionSlider(1);
    if (text == 'grows') transitionSlider(15);
    if (text == 'moving') moveBlue();
  });

  var linear0 = draw('ensemble-2d-linear', 1);
  var linear1 = draw('ensemble-2d-piecewise', 3);
  renderFns.renderAll();

  function draw(id, numSteps) {
    var sel = d3
      .select('#' + id)
      .html('')
      .classed('ensemble-2d', 1);
    var captionSel = sel.append('div.title');

    var sliderSel = sel
      .append('input.control')
      .at({type: 'range', min: 1, max: 20, step: 1, value: state.numTop})
      .on('input', function () {
        state.numTop = this.value;
        renderFns.renderAll();
      });

    var c = d3.conventions({
      sel: sel.append('div'),
      height: 300,
      // width: 300,
      margin: {top: 0, left: 0, bottom: 0, right: 0},
    });
    c.sel.select('svg').st({overflow: 'hidden'});

    sel
      .append('div.control')
      .append('span.button')
      .text('🎲 Retrain 🎲')
      .on('click', () => {
        linear0.initModels();
        linear1.initModels();
        renderFns.renderAll();
      });

    // c.svg.append('rect').at({width: c.width, height: c.height, fill: '#eee'})

    // Max number of areas to actually render — layering 20+ areas flickers as opacity drops
    // TODO: try to find where flicker break points area?
    var maxAreas = 20;

    var topModelData = d3.range(50).map((i) => ({i}));
    var topModelDataReversed = topModelData.slice().reverse();
    topModelDataReversed.forEach((d, i) => (d.reverseIndex = i));

    var botAreaSel = c.svg
      .append('g')
      .appendMany('path.model', topModelDataReversed)
      .at({fillOpacity: (d) => (d.i > maxAreas ? 0 : 1)});

    var topAreaSel = c.svg
      .append('g')
      .appendMany('path.model', topModelDataReversed)
      .at({fillOpacity: (d) => (d.i > maxAreas ? 0 : 1)});

    var topModelSel = c.svg
      .append('g')
      .appendMany('path.model', topModelDataReversed)
      .at({stroke: '#000', fill: 'none', strokeWidth: 0.1});

    var drag = d3
      .drag()
      .on('start', () => c.svg.classed('is-dragging', 1))
      .on('end', () => c.svg.classed('is-dragging', 0))
      .on('drag', function (d) {
        d.x = d3.clamp(0.05, c.x.invert(d3.event.x), 1 - 0.05);
        d.y = d3.clamp(0.05, c.y.invert(d3.event.y), 1 - 0.05);
        d.moved = false;
        renderFns.renderAll();
      })
      .on('start.cursor end.cursor', function () {
        d3.select(this).st({
          cursor: d3.event.type == 'end' ? 'grab' : 'grabbing',
        });
        c.svg.st({cursor: d3.event.type === 'end' ? '' : 'grabbing'});
      })
      .subject(function (d) {
        return {x: c.x(d.x), y: c.y(d.y)};
      });

    var circleSel = c.svg
      .appendMany('circle', points)
      .at({
        r: 4,
        fill: (d) => colors2d[d.color],
        stroke: (d) => d3.color(colors2d[d.color]).darker(0.8),
        strokeWidth: 1.5,
      })
      .st({fillOpacity: 0.3, cursor: 'pointer'})
      .call(drag);

    // generate random line models
    var randomUniform = d3.randomUniform.source(new Math.seedrandom('ds'));
    // var randomUniform = d3.randomUniform

    var models;
    function initModels(numModels = 50000) {
      models = d3.range(numModels).map((i) => {
        var curX = 0;
        var xVals = [0];
        while (xVals.length - 1 < numSteps)
          xVals.push((curX += randomUniform()()));
        xVals = xVals.map((d) => d / curX);

        var bVals = [];
        var mVals = [];
        var curB = randomUniform(-3, 3)();

        for (let i = 0; i < xVals.length - 1; i++) {
          bVals.push(curB);
          curM = randomUniform(curB < 0 ? 0 : -3, curB > 1 ? 0 : 3)();
          mVals.push(curM);

          curB = curB + curM * (xVals[i + 1] - xVals[i]);
        }
        bVals.push(curB);

        return {xVals, bVals, mVals, i};
      });
    }
    initModels();

    function render() {
      var sortedModels = _.sortBy(models, (d) => {
        var score = 0;
        for (let i = 0; i < points.length; i++) {
          var p = points[i];

          let j = 0;
          while (d.xVals[j + 1] <= p.x) j++;

          let m = d.mVals[j];
          let b = d.bVals[j];

          var yDist = d3.clamp(-0.1, b + m * (p.x - d.xVals[j]) - p.y, 0.1);
          // yDist = (1 - yDist)*(1 - yDist)
          p.color ? (score += yDist) : (score -= yDist);
          // var isAbove = p.y > b + m*(p.x - d.xVals[j])
          // isAbove ^ p.color ? score++ : score--
        }
        d.rawScore = score;
        d.score = Math.abs(score);
        return -Math.abs(d.score);
      });

      topModelData.forEach((d, i) => (d.model = sortedModels[i]));
      topModelData.forEach((topModel) => {
        var m = topModel.model;
        if (m.pathStr) return;

        m.pathStr =
          'M' + m.xVals.map((d, i) => [c.x(d), c.y(m.bVals[i])]).join('L');
        m.topAreaStr = m.pathStr + 'V -10 H 0 Z';
        m.botAreaStr = m.pathStr + 'V 350 H 0 Z';
      });

      topModelSel
        .st({opacity: (d, i) => (d.i < state.numTop ? 1 : 0)})
        .at({d: (d) => d.model?.pathStr});

      var areaOpacity = 1 / +Math.min(maxAreas, state.numTop);
      var areaOpacity = d3.easePolyOut.exponent(2)(areaOpacity) / 1.5;
      if (state.numTop == 1) areaOpacity = 0.76;
      // var areaOpacity = d3.clamp(.05, areaOpacity, .9)
      botAreaSel
        .st({opacity: (d, i) => (d.i < state.numTop ? areaOpacity : 0)})
        .at({
          d: (d) => d.model?.botAreaStr,
          fill: (d) => colors2d[d.model?.rawScore > 0 ? 1 : 0],
        });

      topAreaSel
        .st({opacity: (d, i) => (d.i < state.numTop ? areaOpacity : 0)})
        .at({
          d: (d) => d.model?.topAreaStr,
          fill: (d) => colors2d[d.model?.rawScore > 0 ? 0 : 1],
        });

      circleSel.translate((d) => [c.x(d.x), c.y(d.y)]);

      sliderSel.node().value = state.numTop;

      captionSel.text(`
        ${state.numTop} ${numSteps == 1 ? 'Linear' : 'Piecewise Linear'} 
        Model${state.numTop > 1 ? 's' : ''}
      `);
    }
    renderFns.push(render);

    return {render, initModels};
  }
};

console.clear();
draw_2d();
// if (window.init) window.init()

// Linear models
// var models = d3.range(10000).map(i => {
//   var m = randomUniform(-3, 3)()
//   var b = randomUniform(-3, 3)()

//   var pathStr = ['M', c.x(0), c.y(b), 'L', c.x(1), c.y(b + m)].join(' ')

//   return {m, b, pathStr}
// })

// var sortedModels = _.sortBy(models, d => {
//   var score = 0
//   for (let i = 0; i < points.length; i++){
//     var p = points[i]
//     var isAbove = p.y > d.b + d.m*p.x
//     isAbove ^ p.color ? score++ : score--
//   }
//   return -Math.abs(score)
// })

// adjust number of kinks

// var sliderSel = sel.append('input')
//   .at({
//     type:'range',
//     min: 1,
//     max: 8,
//     step: 1,
//     value: numSteps
//   })
//   .on('input', function(){
//     numSteps = this.value
//     models = initModels(5000)
//     renderFns.renderAll()
//   })
//   .on('change', () => {
//     models = initModels()
//     renderFns.renderAll()
//   })
