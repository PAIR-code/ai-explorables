!(async function () {
  var isLock = false;

  var csvstr = await (await fetch('rotated-accuracy.csv')).text();
  var allData = d3.csvParse(csvstr).filter((d) => {
    d.slug = [d.dataset_size, d.aVal, d.minority_percent].join(' ');

    d.accuracy_orig =
      (+d.accuracy_test_data_1 + +d.accuracy_test_data_7) / 2000;
    d.accuracy_rot =
      (+d.accuracy_test_data_1_rot + +d.accuracy_test_data_7_rot) / 2000;
    d.accuracy_dif = d.accuracy_orig - d.accuracy_rot;

    return d.accuracy_orig > 0 && d.accuracy_rot > 0;
  });

  var data = d3.nestBy(allData, (d) => d.slug);
  data.forEach((slug) => {
    slug.accuracy_orig = d3.median(slug, (d) => d.accuracy_orig);
    slug.accuracy_rot = d3.median(slug, (d) => d.accuracy_rot);
    slug.accuracy_dif = slug.accuracy_orig - slug.accuracy_rot;

    slug.dataset_size = +slug[0].dataset_size;
    slug.aVal = +slug[0].aVal;
    slug.minority_percent = +slug[0].minority_percent;
  });

  // d3.nestBy(data, d => d.length).forEach(d => {
  //   console.log(d.key, d.length)
  // })

  var byMetrics = 'dataset_size aVal minority_percent'
    .split(' ')
    .map((metricStr) => {
      var byMetric = d3.nestBy(data, (d) => d[metricStr]);
      byMetric.forEach((d) => (d.key = +d.key));
      byMetric = _.sortBy(byMetric, (d) => d.key);
      byMetric.forEach((d, i) => {
        d.metricIndex = i;
        d.forEach((e) => (e['metric_' + metricStr] = d));
      });

      byMetric.forEach((d, i) => {
        if (metricStr == 'dataset_size')
          d.label = i % 2 == 0 ? '' : d3.format(',')(d.key);
        if (metricStr == 'aVal') d.label = '';
        if (metricStr == 'minority_percent')
          d.label = i % 2 ? '' : d3.format('.0%')(d.key);
      });

      byMetric.active = byMetric[5];
      byMetric.metricStr = metricStr;
      byMetric.label = {
        dataset_size: 'Training Points',
        aVal: 'Less Privacy',
        minority_percent: 'Percent Rotated In Training Data',
      }[metricStr];

      return byMetric;
    });

  // Heat map
  !(function () {
    var sel = d3
      .select('.rotated-accuracy-heatmap')
      .html('')
      .st({width: 1100, position: 'relative', left: (850 - 1100) / 2})
      .at({
        role: 'graphics-document',
        'aria-label': `Faceted MNIST models by the percent of rotated digits in training data. Heatmaps show how privacy and training data change accuracy on rotated and original digits.`,
      });

    sel
      .append('div.chart-title')
      .text('Percentage of training data rotated 90° →');

    sel
      .appendMany('div', byMetrics[2]) //.filter((d, i) => i % 2 == 0))
      .st({display: 'inline-block'})
      .each(drawHeatmap);
  })();
  function drawHeatmap(sizeData, chartIndex) {
    var s = 8;
    var n = 11;

    var c = d3.conventions({
      sel: d3.select(this),
      width: s * n,
      height: s * n,
      margin: {left: 5, right: 5, top: 30, bottom: 50},
    });

    c.svg.append('rect').at({width: c.width, height: c.height, fillOpacity: 0});

    c.svg
      .append('text.chart-title')
      .text(d3.format('.0%')(sizeData.key))
      .at({dy: -4, textAnchor: 'middle', x: c.width / 2})
      .st({fontWeight: 300});

    var linearScale = d3.scaleLinear().domain([0, 0.5]).clamp(1);
    var colorScale = (d) => d3.interpolatePlasma(linearScale(d));

    var pad = 0.5;
    var dataSel = c.svg
      .on('mouseleave', () => (isLock = false))
      .append('g')
      .translate([0.5, 0.5])
      .appendMany('g.accuracy-rect', sizeData)
      .translate((d) => [
        s * d.metric_dataset_size.metricIndex,
        s * (n - d.metric_aVal.metricIndex),
      ])
      .call(d3.attachTooltip)
      .on('mouseover', (d, i, node, isClickOverride) => {
        updateTooltip(d);

        if (isLock && !isClickOverride) return;

        byMetrics[0].setActiveCol(d.metric_dataset_size);
        byMetrics[1].setActiveCol(d.metric_aVal);
        byMetrics[2].setActiveCol(d.metric_minority_percent);

        return d;
      })
      .on('click', clickCb)
      .st({cursor: 'pointer'});

    dataSel.append('rect').at({
      width: s - pad,
      height: s - pad,
      fillOpacity: 0.1,
    });

    // dataSel.append('rect')
    //   .at({
    //     width:  d => Math.max(1, (s - pad)*(d.accuracy_orig - .5)*2),
    //     height: d => Math.max(1, (s - pad)*(d.accuracy_rot - .5)*2),
    //   })
    sizeData.forEach((d) => {
      d.y_orig = Math.max(0, (s - pad) * (d.accuracy_orig - 0.5) * 2);
      d.y_rot = Math.max(0, (s - pad) * (d.accuracy_rot - 0.5) * 2);
    });

    dataSel.append('rect').at({
      height: (d) => d.y_orig,
      y: (d) => s - d.y_orig,
      width: s / 2,
      x: s / 2,
      fill: 'purple',
    });
    dataSel.append('rect').at({
      height: (d) => d.y_rot,
      y: (d) => s - d.y_rot,
      width: s / 2,
      fill: 'orange',
    });

    sizeData.updateActiveRect = function (match) {
      dataSel
        .classed('active', (d) => match == d)
        .filter((d) => match == d)
        .raise();
    };

    if (chartIndex == 0) {
      c.svg.append('g.x.axis').translate([10, c.height]);
      c.svg.append('g.y.axis').translate([0, 5]);

      util.addAxisLabel(c, 'Training Points →', 'Less Privacy →', 30, -15);
    }

    if (chartIndex == 8) {
      c.svg
        .appendMany('g.axis', [
          'Original Digit Accuracy',
          'Rotated Digit Accuracy',
        ])
        .translate((d, i) => [c.width - 230 * i - 230 - 50, c.height + 30])
        .append('text.axis-label')
        .text((d) => d)
        .st({fontSize: 14})
        .parent()
        .appendMany('rect', (d, i) =>
          d3.range(0.2, 1.2, 0.2).map((v, j) => ({i, v, j})),
        )
        .at({
          width: s / 2,
          y: (d) => s - d.v * s - s,
          height: (d) => d.v * s,
          fill: (d) => ['purple', 'orange'][d.i],
          x: (d) => d.j * s * 0.75 - 35,
        });
    }
  }

  // Metric barbell charts
  !(function () {
    var sel = d3.select('.rotated-accuracy').html('').at({
      role: 'graphics-document',
      'aria-label': `Barbell charts showing up privacy / data / percent underrepresented data all trade-off in complex ways.`,
    });

    sel
      .appendMany('div', byMetrics)
      .st({
        display: 'inline-block',
        width: 300,
        marginRight: 10,
        marginBottom: 50,
        marginTop: 10,
      })
      .each(drawMetricBarbell);
  })();
  function drawMetricBarbell(byMetric, byMetricIndex) {
    var sel = d3.select(this);

    var c = d3.conventions({
      sel,
      height: 220,
      width: 220,
      margin: {bottom: 10, top: 5},
      layers: 's',
    });
    c.svg.append('rect').at({width: c.width, height: c.height, fillOpacity: 0});

    c.y.domain([0.5, 1]).interpolate(d3.interpolateRound);
    c.x
      .domain([0, byMetric.length - 1])
      .clamp(1)
      .interpolate(d3.interpolateRound);

    c.xAxis
      .tickValues(d3.range(byMetric.length))
      .tickFormat((i) => byMetric[i].label);
    c.yAxis.ticks(5).tickFormat((d) => d3.format('.0%')(d));

    d3.drawAxis(c);
    util.addAxisLabel(
      c,
      byMetric.label + ' →',
      byMetricIndex ? '' : 'Accuracy',
    );
    util.ggPlotBg(c, false);

    c.svg.select('.x').raise();
    c.svg.selectAll('.axis').st({pointerEvents: 'none'});

    c.svg
      .append('defs')
      .append('linearGradient#purple-to-orange')
      .at({x1: '0%', x2: '0%', y1: '0%', y2: '100%'})
      .append('stop')
      .at({offset: '0%', 'stop-color': 'purple'})
      .parent()
      .append('stop')
      .at({offset: '100%', 'stop-color': 'orange'});

    c.svg
      .append('defs')
      .append('linearGradient#orange-to-purple')
      .at({x1: '0%', x2: '0%', y2: '0%', y1: '100%'})
      .append('stop')
      .at({offset: '0%', 'stop-color': 'purple'})
      .parent()
      .append('stop')
      .at({offset: '100%', 'stop-color': 'orange'});

    var colSel = c.svg
      .appendMany('g', byMetric)
      .translate((d) => c.x(d.metricIndex) + 0.5, 0)
      .st({pointerEvents: 'none'});

    var pathSel = colSel
      .append('path')
      .at({stroke: 'url(#purple-to-orange)', strokeWidth: 1});

    var rectSel = colSel.append('rect').at({width: 1, x: -0.5});

    var origCircleSel = colSel
      .append('circle')
      .at({r: 3, fill: 'purple', stroke: '#000', strokeWidth: 0.5});

    var rotCircleSel = colSel
      .append('circle')
      .at({r: 3, fill: 'orange', stroke: '#000', strokeWidth: 0.5});

    function clampY(d) {
      return d3.clamp(0, c.y(d), c.height + 3);
    }

    byMetric.updateActiveCol = function () {
      var findObj = {};
      byMetrics
        .filter((d) => d != byMetric)
        .forEach((d) => {
          findObj[d.metricStr] = d.active.key;
        });

      byMetric.forEach((col) => {
        col.active = _.find(col, findObj);
      });

      origCircleSel.at({cy: (d) => clampY(d.active.accuracy_orig)});
      rotCircleSel.at({cy: (d) => clampY(d.active.accuracy_rot)});

      // pathSel.at({
      //   d: d => 'M 0 ' + clampY(d.active.accuracy_orig) + ' L 1 ' + clampY(d.active.accuracy_rot)
      // })

      rectSel.at({
        y: (d) =>
          Math.min(
            clampY(d.active.accuracy_orig),
            clampY(d.active.accuracy_rot),
          ),
        height: (d) =>
          Math.abs(
            clampY(d.active.accuracy_orig) - clampY(d.active.accuracy_rot),
          ),
        fill: (d) =>
          d.active.accuracy_orig > d.active.accuracy_rot
            ? 'url(#purple-to-orange)'
            : 'url(#orange-to-purple)',
      });
    };
    byMetric.updateActiveCol();

    c.svg
      .call(d3.attachTooltip)
      .st({cursor: 'pointer'})
      .on('mousemove', function (d, i, node, isClickOverride) {
        var [mx] = d3.mouse(this);
        var metricIndex = Math.round(c.x.invert(mx));

        var prevActive = byMetric.active;
        byMetric.active = byMetric[metricIndex];
        updateTooltip();
        byMetric.active = prevActive;

        if (isLock && !isClickOverride) return;
        byMetric.setActiveCol(byMetric[metricIndex]);

        return byMetric[metricIndex];
      })
      .on('click', clickCb)
      .on('mouseexit', () => (isLock = false));

    byMetric.setActiveCol = function (col) {
      if (col) byMetric.active = col;

      c.svg
        .selectAll('.x .tick')
        .classed('active', (i) => i == byMetric.active.metricIndex);

      colSel.classed('active', (d) => d == byMetric.active);

      if (col) renderActiveCol();
    };
    byMetric.setActiveCol();
  }

  function renderActiveCol() {
    byMetrics.forEach((d) => {
      if (d.updateActiveCol) d.updateActiveCol();
    });

    var findObj = {};
    byMetrics.forEach((d) => (findObj[d.metricStr] = d.active.key));
    var match = _.find(data, findObj);

    byMetrics[2].forEach((d) => {
      if (d.updateActiveRect) d.updateActiveRect(match);
    });
  }

  function updateTooltip(d) {
    if (!d) {
      var findObj = {};
      byMetrics.forEach((d) => (findObj[d.metricStr] = d.active.key));
      d = _.find(data, findObj);
    }

    var epsilon = Math.round(d[0].epsilon * 100) / 100;
    ttSel
      .html(
        `
      <div>
        <b>${d3.format('.0%')(d.accuracy_orig)}</b> 
        accuracy on 
        <span style='padding: 2px; background: purple; color: #fff'>
          original digits
        </span>
      <div>
      <div>
        <b>${d3.format('.0%')(d.accuracy_rot)}</b> 
        accuracy on 
        <span style='padding: 2px; background: orange; color: #000'>
          rotated digits
        </span>
      <br>
      <br>
      <div>Training points: ${d3.format(',')(d.dataset_size)}</div>
      <div>Privacy: ${epsilon} ε</div>
      <div>Rotated in training data: ${d3.format('.0%')(d.minority_percent)} </div>

    `,
      )
      .st({width: 230});

    ttSel.classed('tooltip-footnote', 0);
  }

  function clickCb(d, i, node) {
    var mFn =
      d3.select(this).on('mouseover') || d3.select(this).on('mousemove');

    var e = mFn.call(this, d, i, node, true);
    isLock = e == isLock ? null : e;
  }
})();
