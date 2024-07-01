console.clear();
d3.select('body').selectAppend('div.tooltip.tooltip-hidden');

var colors = ['#c0584b', '#649398'];

d3.loadData(
  'https://roadtolarissa.com/colab/gender-over-time-colab/processed_vocab.json',
  (err, res) => {
    window.vocab = res[0];
    d3.select('#graph').html('').datum(jsData).each(drawSentence);
  },
);

async function drawSentence({s0, s1, tidyCSV, minYear}, i) {
  var tidy = d3.csvParse(jsData.tidyCSV);

  console.log(minYear);
  tidy.forEach((d) => {
    d.year = minYear + +d.year_index;
    d.i = +d.token_index;
    d.e0 = +d.e0;
    d.e1 = +d.e1;
    d.mean = d.e0 + d.e1;
    d.dif = d.e0 - d.e1;
  });

  var sel = d3.select(this).st({marginRight: 20});
  sel.append('div').st({color: colors[0]}).text(s0);
  sel.append('div').st({color: colors[1]}).text(s1);
  var c = d3.conventions({
    sel,
    height: 300,
    width: 300,
    margin: {left: 0, bottom: 50, right: 60},
  });

  c.svg
    .append('rect')
    .at({width: c.width, height: c.height / 2, opacity: 0.1, fill: colors[0]});

  c.svg.append('rect').at({
    width: c.width,
    height: c.height / 2,
    opacity: 0.1,
    fill: colors[1],
    y: c.height / 2,
  });

  console.log(tidy[0]);
  c.x.domain(d3.extent(tidy, (d) => d.year));

  var minY = d3.min(
    d3.extent(tidy, (d) => d.dif),
    Math.abs,
  );
  var maxY = d3.max(
    d3.extent(tidy, (d) => d.dif),
    Math.abs,
  );
  c.y.domain([-minY, minY]);
  c.y.domain([-maxY, maxY]);
  // c.y.domain([-4.5, 4.5])

  c.xAxis.tickFormat((d) => d);
  c.yAxis.ticks(5);
  d3.drawAxis(c);

  var byToken = d3.nestBy(tidy, (d) => d.i);
  byToken.forEach((d) => {
    d.endY = c.y(_.last(d).dif);
    d.str = vocab[+d.key].replace('▁', '');
    d.displayLabel = true;
    d.mean = d3.sum(d, (e) => e.mean);
  });
  console.log(tidy[0]);

  d3.nestBy(
    _.sortBy(byToken, (d) => -d.mean),
    (d) => Math.round(d.endY / 12),
  ).forEach((d) => d.forEach((e, i) => (e.displayLabel = !i)));

  var line = d3
    .line()
    .x((d) => c.x(d.year))
    .y((d) => c.y(d.dif));

  var tokenSel = c.svg
    .appendMany('g', byToken)
    // .call(d3.attachTooltip)
    .on('mouseover', function () {
      tokenSel.classed('active', 0);
      d3.select(this).raise().classed('active', 1);
    });

  c.svg.on('mouseleave', function () {
    tokenSel.classed('active', 0);
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
