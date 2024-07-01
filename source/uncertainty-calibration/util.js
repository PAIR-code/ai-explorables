window.initUtil = function () {
  function addAxisLabel(c, xText, yText, xOffset = 40, yOffset = -40) {
    c.svg
      .select('.x')
      .append('g')
      .translate([c.width / 2, xOffset])
      .append('text.axis-label')
      .text(xText)
      .at({textAnchor: 'middle'})
      .st({fill: '#000', fontSize: 14, fontFamily: 'sans-serif'});

    c.svg
      .select('.y')
      .append('g')
      .translate([yOffset, c.height / 2])
      .append('text.axis-label')
      .text(yText)
      .at({textAnchor: 'middle', transform: 'rotate(-90)'})
      .st({fill: '#000', fontSize: 14, fontFamily: 'sans-serif'});
  }

  function ggPlotBg(c, isBlack = true) {
    if (isBlack) {
      c.svg
        .append('rect.bg-rect')
        .at({width: c.width, height: c.height, fill: '#eee'})
        .lower();
    }

    c.svg.selectAll('.tick').selectAll('line').remove();
    c.svg
      .selectAll('.y .tick')
      .append('path')
      .at({d: 'M 0 0 H ' + c.width, stroke: '#fff', strokeWidth: 1});
    c.svg.selectAll('.y text').at({x: -3});
    c.svg
      .selectAll('.x .tick')
      .append('path')
      .at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1});
  }

  return {addAxisLabel, ggPlotBg};
};

if (window.init) window.init();
