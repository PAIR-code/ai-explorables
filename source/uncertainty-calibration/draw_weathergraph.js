window.drawWeatherGraph = function (graphSel, fig_height, fig_width) {
  var threshold = 0.4;

  var thresholds = [0, 0.2, 0.4, 0.6, 0.8, 1].map((val, i) => {
    var isLocked = val == 0 || val == 1;
    return {val, i, isLocked, origVal: val};
  });

  var c = d3.conventions({
    sel: graphSel.html('').append('div'),
    height: fig_height,
    totalWidth: fig_width,
    margin: {top: 100, bottom: 100},
  });

  var {predictionSel, weatherGroupSel} = (function () {
    c.y.domain([0, 9]).clamp(true);

    // x-Axis
    c.xAxis.ticks(5).tickFormat(d3.format('.2f'));
    c.yAxis.ticks(0);
    d3.drawAxis(c);
    c.svg.select('.x').translate(-40, 1).selectAll('line').translate(20, 1);

    // x-Axis label
    c.svg
      .append('text.axis-label')
      .translate([c.width / 2, -50])
      .at({textAnchor: 'middle'})
      .at({fill: '#000', fontSize: 14})
      .text('Model Score');

    // Weather icons
    var weatherGroupSel = c.svg
      .appendMany('g.weatherdata', weatherdata)
      .translate((d) => [c.x(d.score), c.y(d.h)]);
    //.call(d3.attachTooltip)
    // .on("mouseover", function(d) {
    //   ttSel.html("");
    //   var gtSel = ttSel.append("div").html(`ground truth: <span>${d.label}</span>`);
    //   ttSel.classed("tt-text", true);
    // })

    weatherGroupSel
      .append('text.icon')
      .text(function (d, i) {
        return emojis[d.label];
      })
      .at({fontSize: 18, textAnchor: 'middle', dy: 8});

    // Add prediction circles
    weatherGroupSel
      .append('circle.prediction')
      .at({cx: 0, cy: 0, r: 14, opacity: 0, fillOpacity: 0, stroke: 'red'});
    weatherGroupSel.append('path.prediction').at({
      d: (d) => ['M', -10, 10, 'L', 10, -10].join(' '),
      stroke: 'red',
      opacity: 0,
    });

    var predictionSel = c.svg.selectAll('.prediction');

    return {predictionSel, weatherGroupSel};
  })();

  var {thresholdSel, messageSel, setThreshold} = (function () {
    var thresholdSel = c.svg.append('g.threshold');

    var thresholdGroupSel = thresholdSel
      .append('g')
      .call(
        d3
          .drag()
          .on('drag', () =>
            renderThreshold(c.x.invert(d3.clamp(0, d3.event.x, c.width))),
          ),
      );

    var thesholdTextSel = thresholdGroupSel
      .append('g.axis')
      .append('text')
      .at({
        textAnchor: 'middle',
        dy: '.33em',
        y: c.height + 30,
      })
      .text('Threshold');

    var rw = 16;
    thresholdGroupSel.append('rect').at({
      width: rw,
      x: -rw / 2,
      y: -10,
      height: c.height + 30,
      fillOpacity: 0.07,
    });

    var pathSel = thresholdGroupSel.append('path').at({
      stroke: '#000',
      strokeDasharray: '2 2',
      fill: 'none',
      d: `M 0 -10 V ` + (c.height + 20),
    });

    var accuracyValBox = thresholdSel.append('rect.val-box').at({
      width: 55,
      height: 20,
      x: c.width / 2 + 32.5,
      y: c.height + 65,
      rx: 3,
      ry: 3,
    });

    var accuracySel = thresholdSel
      .append('text.big-text')
      .at({x: c.width / 2 - 10, y: c.height + 80, textAnchor: 'middle'});

    var accuracyValSel = thresholdSel
      .append('text.val-text')
      .at({x: c.width / 2 + 60, y: c.height + 80, textAnchor: 'middle'});

    var messageSel = thresholdSel
      .append('text.tmessage')
      .at({x: c.width / 2, y: c.height + 120, textAnchor: 'middle'});

    function renderThreshold(t) {
      if (isNaN(t)) return; // TODO debug this

      thresholdGroupSel.translate(c.x(t), 0);

      predictionSel.at({opacity: (d) => (isClassifiedCorrectly(d, t) ? 0 : 1)});

      var acc = d3.mean(weatherdata, (d) => isClassifiedCorrectly(d, t));
      accuracySel.text('Accuracy: ');
      accuracyValSel.text(d3.format('.1%')(acc));
      messageSel.text(
        'Try dragging the threshold to find the highest accuracy.',
      );
      thesholdTextSel.text('Threshold: ' + d3.format('.2f')(t));

      threshold = t;

      function isClassifiedCorrectly(d, t) {
        return d.score >= t ? d.label == 1 : d.label == 0;
      }
    }

    renderThreshold(threshold);

    var timer = null;
    function setThreshold(newThreshold, duration) {
      var interpolateFn = d3.interpolate(threshold, newThreshold);

      if (timer) timer.stop();
      timer = d3.timer((ms) => {
        var t = Math.min(ms / duration, 1);
        if (t == 1) timer.stop();

        renderThreshold(interpolateFn(t));
      });
    }

    return {thresholdSel, messageSel, setThreshold};
  })();

  function drawTrueLegend(c) {
    var truthAxis = c.svg.append('g').translate([fig_width + 40, 1]);
    truthAxis
      .append('text.legend-title')
      .text('Truth') // TODO: Maybe more of a label? "what actually happened?" or just remove this legend
      .at({textAnchor: 'middle', fontWeight: 500, x: 20});

    truthAxis
      .append('g')
      .translate([20, 40])
      .append('text.legend-text')
      .text('Sunny')
      .parent()
      .at({fontSize: 15})
      .append('text')
      .text(emojis[0])
      .at({fontSize: 25, x: -30, y: 5});

    truthAxis
      .append('g')
      .translate([20, 80])
      .append('text.legend-text')
      .text('Rainy')
      .parent()
      .at({fontSize: 15})
      .append('text')
      .text(emojis[1])
      .at({fontSize: 25, x: -30, y: 5});
  }
  drawTrueLegend(c);

  var {thresholdsGroupSel, renderThresholds, setThresholds} = (function () {
    var valsCache = [];
    var drag = d3
      .drag()
      .on('drag', function () {
        var val = d3.clamp(0, c.x.invert(d3.mouse(c.svg.node())[0]), 1);

        // Force thresholds to stay sorted
        valsCache[valsCache.activeIndex] = val;
        _.sortBy(valsCache).forEach((val, i) => (thresholds[i].val = val));

        renderThresholds();
      })
      .on('start', (d) => {
        valsCache = thresholds.map((d) => d.val);
        valsCache.activeIndex = d.i;
      });

    var thresholdsGroupSel = c.svg.append('g');

    thresholdsGroupSel
      .append('text.axis-label')
      .text('Calibrated Model Score')
      .translate([c.width / 2, c.height + 50])
      .at({textAnchor: 'middle'})
      .at({fill: '#000', fontSize: 14});

    thresholdsSel = thresholdsGroupSel
      .appendMany('g.thresholds', thresholds)
      .call(drag)
      .st({pointerEvents: (d) => (d.isLocked ? 'none' : '')});

    thresholdsSel
      .append('g.axis')
      .append('text')
      .at({
        textAnchor: 'middle',
        dy: '.33em',
        y: c.height + 20,
      })
      .text((d) => d3.format('.2f')(d.origVal));

    var rw = 16;
    thresholdsSel.append('rect').at({
      width: rw,
      x: -rw / 2,
      height: c.height + 10,
      fillOpacity: (d) => (d.isLocked ? 0 : 0.07),
    });

    var pathSel = thresholdsSel.append('path').at({
      stroke: '#000',
      strokeDasharray: '2 2',
      fill: 'none',
    });

    function renderThresholds() {
      if (thresholds.some((d) => isNaN(d.val))) return;

      thresholdsSel.translate((d) => c.x(d.val) + 0.5, 0);

      pathSel.at({
        d: (d) =>
          [
            'M',
            0,
            c.height + 10,
            'L',
            0,
            0,
            'L',
            c.x(d.origVal - d.val),
            -12,
          ].join(' '),
      });

      if (window.calibrationCurve) calibrationCurve.renderBuckets();
    }

    renderThresholds();

    var timer = null;
    function setThresholds(newThresholds, duration) {
      var interpolateFns = thresholds.map((d, i) =>
        d3.interpolate(d.val, newThresholds[i]),
      );

      if (timer) timer.stop();
      timer = d3.timer((ms) => {
        var t = Math.min(ms / duration, 1);
        if (t == 1) timer.stop();

        thresholds.forEach((d, i) => (d.val = interpolateFns[i](t)));

        renderThresholds();
      });
    }

    return {thresholdsGroupSel, renderThresholds, setThresholds};
  })();

  return {
    c,
    thresholdSel,
    messageSel,
    setThreshold,
    predictionSel,
    thresholds,
    thresholdsGroupSel,
    renderThresholds,
    setThresholds,
    weatherGroupSel,
  };
};

if (window.init) window.init();
