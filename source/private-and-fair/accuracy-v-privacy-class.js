var state = {
  dataset_size: 15000,
  threshold: 0.8,
  label: 8,
};

var sel = d3.select('.accuracy-v-privacy-class').html('').at({
  role: 'graphics-document',
  'aria-label': `Line chart showing that high accuracy models can still perform poorly on some digit classes.`,
});

async function loadData() {
  var rawData = await util.getFile(
    `cns-cache/grid_${state.dataset_size}trainpoints_test_labels.csv`,
  );

  rawData.forEach((d) => {
    delete d[''];
    d.i = +d.i;
    d.label = +d.label;
  });

  var aVal2Meta = {};
  var metadata = await util.getFile('cns-cache/model_grid_test_accuracy.json');
  metadata
    .filter((d) => d.dataset_size == state.dataset_size)
    .forEach((d) => (aVal2Meta['aVal_' + d.aVal] = d));

  var allCols = d3
    .keys(rawData[0])
    .filter((d) => d.includes('aVal'))
    .map((key) => {
      var {epsilon, aVal} = aVal2Meta[key];
      return {key, epsilon, aVal};
    });

  var byDigit = d3.nestBy(rawData, (d) => d.label);
  byDigit.forEach((d) => {
    d.label = +d.key;
  });
  byDigit.forEach((digitClass) => {
    digitClass.cols = allCols.map(({key, epsilon}, colIndex) => {
      return {
        key,
        colIndex,
        epsilon,
        digitClass,
        label: digitClass.label,
        accuracy: d3.mean(digitClass, (d) => d[key] > state.threshold),
      };
    });
  });

  var data = _.flatten(byDigit.map((d) => d.cols)).filter(
    (d) =>
      util.epsilonExtent[1] <= d.epsilon && d.epsilon <= util.epsilonExtent[0],
  );
  var byLabel = d3.nestBy(data, (d) => d.label);
  byLabel.forEach((d, i) => {
    d.label = d.key;
  });

  return {data, byLabel};
}

async function initChart() {
  var {data, byLabel} = await loadData();

  var c = d3.conventions({
    sel: sel.append('div'),
    height: 400,
    margin: {bottom: 75, top: 5},
    layers: 'ds',
  });

  c.x = d3.scaleLog().domain(util.epsilonExtent).range(c.x.range());
  c.xAxis = d3.axisBottom(c.x).tickFormat((d) => {
    var rv = d + '';
    if (rv.split('').filter((d) => d != 0 && d != '.')[0] == 1) return rv;
  });

  c.yAxis.tickFormat((d) => d3.format('.0%')(d)); //.ticks(8)
  d3.drawAxis(c);
  util.addAxisLabel(c, 'Higher Privacy →', '');
  util.ggPlotBg(c, false);
  c.layers[0]
    .append('div')
    .st({
      fontSize: 12,
      color: '#555',
      width: 120 * 2,
      textAlign: 'center',
      lineHeight: '1.3em',
      verticalAlign: 'top',
    })
    .translate([c.width / 2 - 120, c.height + 45])
    .html('in ε');

  var line = d3
    .line()
    .x((d) => c.x(d.epsilon))
    .y((d) => c.y(d.accuracy));

  var lineSel = c.svg
    .append('g')
    .appendMany('path.accuracy-line', byLabel)
    .at({
      d: line,
      fill: 'none',
      stroke: '#000',
      // opacity: 0,
    })
    .on('mousemove', setActiveLabel);

  var circleSel = c.svg
    .append('g')
    .appendMany('g.accuracy-circle', data)
    .translate((d) => [c.x(d.epsilon), c.y(d.accuracy)])
    .on('mousemove', setActiveLabel);
  // .call(d3.attachTooltip)

  circleSel.append('circle').at({r: 7, stroke: '#fff'});

  circleSel
    .append('text')
    .text((d) => d.label)
    .at({textAnchor: 'middle', fontSize: 10, fill: '#fff', dy: '.33em'});

  setActiveLabel(state);
  function setActiveLabel({label}) {
    lineSel
      .classed('active', 0)
      .filter((d) => d.label == label)
      .classed('active', 1)
      .raise();

    circleSel
      .classed('active', 0)
      .filter((d) => d.label == label)
      .classed('active', 1)
      .raise();

    state.label = label;
  }

  async function updateDatasetSize() {
    var newData = await loadData();
    data = newData.data;
    byLabel = newData.byLabel;

    lineSel.data(byLabel).transition().at({d: line});

    circleSel
      .data(data)
      .transition()
      .translate((d) => [c.x(d.epsilon), c.y(d.accuracy)]);

    c.svg.select('text.annotation').remove();
  }

  function updateThreshold() {
    data.forEach((d) => {
      d.accuracy = d3.mean(d.digitClass, (e) => e[d.key] > state.threshold);
    });

    lineSel.at({d: line});
    circleSel.translate((d) => [c.x(d.epsilon), c.y(d.accuracy)]);

    c.svg
      .select('.y .axis-label')
      .text(
        `Test Points With More Than ${d3.format('.2%')(state.threshold)} Confidence In Label`,
      );

    c.svg.select('text.annotation').remove();
  }
  updateThreshold();

  return {c, updateDatasetSize, updateThreshold};
}

async function init() {
  sel
    .append('div.chart-title')
    .text(
      'High accuracy models can still perform poorly on some digit classes',
    );

  var chart = await initChart();

  var buttonRowSel = sel.append('div.button-row').st({height: 50});

  var buttonSel = buttonRowSel
    .append('div')
    .st({width: 500})
    .append('span.chart-title')
    .text('Training points')
    .parent()
    .append('div')
    .st({display: 'inline-block', width: 300, marginLeft: 10})
    .append('div.digit-button-container.dataset_size')
    .appendMany('div.button', [2000, 3750, 7500, 15000, 30000, 60000])
    .text(d3.format(','))
    .classed('active', (d) => d == state.dataset_size)
    .on('click', (d) => {
      buttonSel.classed('active', (e) => e == d);
      state.dataset_size = d;
      chart.updateDatasetSize();
    });

  buttonRowSel
    .append('div.conf-slider')
    .append('span.chart-title')
    .text('Confidence threshold')
    .parent()
    .append('input.slider-native')
    .at({
      type: 'range',
      min: 0.0001,
      max: 0.9999,
      step: 0.0001,
      value: state.threshold,
    })
    .on('input', function () {
      state.threshold = this.value;
      chart.updateThreshold();
    });

  function addSliders() {
    var width = 140;
    var height = 30;
    var color = '#000';

    var sliders = [
      {key: 'threshold', label: 'Confidence threshold', r: [0.0001, 0.9999]},
    ];
    sliders.forEach((d) => {
      d.value = state[d.key];
      d.xScale = d3.scaleLinear().range([0, width]).domain(d.r).clamp(1);
    });

    d3.select('.conf-slider .slider-container').remove();
    d3.select('.slider-native').remove();

    var svgSel = d3
      .select('.conf-slider')
      .parent()
      // .st({marginTop: 5, marginBottom: 5})
      .appendMany('div.slider-container', sliders)
      .append('svg')
      .at({width, height})
      .append('g')
      .translate([10, 25]);

    var sliderSel = svgSel
      .on('click', function (d) {
        d.value = d.xScale.invert(d3.mouse(this)[0]);
        renderSliders(d);
      })
      .classed('slider', true)
      .st({cursor: 'pointer'});

    var textSel = sliderSel
      .append('text.annotation')
      .at({y: -15, fontWeight: 300, textAnchor: 'middle', x: 180 / 2});

    sliderSel
      .append('rect')
      .at({width, height, y: -height / 2, fill: 'rgba(0,0,0,0)'});

    sliderSel.append('path').at({
      d: `M 0 -.5 H ${width}`,
      stroke: color,
      strokeWidth: 1,
    });

    var leftPathSel = sliderSel.append('path').at({
      d: `M 0 -.5 H ${width}`,
      stroke: color,
      strokeWidth: 3,
    });

    var drag = d3.drag().on('drag', function (d) {
      var x = d3.mouse(this)[0];
      d.value = d.xScale.invert(x);

      renderSliders(d);
    });

    var circleSel = sliderSel
      .append('circle')
      .call(drag)
      .at({r: 7, stroke: '#000'});

    function renderSliders(d) {
      if (d) state[d.key] = d.value;

      circleSel.at({cx: (d) => d.xScale(d.value)});
      leftPathSel.at({d: (d) => `M 0 -.5 H ${d.xScale(d.value)}`});
      textSel
        .at({x: (d) => d.xScale(d.value)})
        .text((d) => d3.format('.2%')(d.value));
      chart.updateThreshold();
    }
    renderSliders();
  }
  addSliders();

  chart.c.svg
    .append('text.annotation')
    .translate([505, 212])
    .tspans(
      d3.wordwrap(
        `8s are correctly predicted with high confidence much more rarely than other digits`,
        25,
      ),
      12,
    )
    .at({textAnchor: 'end'});
}
init();
