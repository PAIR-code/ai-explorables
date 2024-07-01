window.makeSliders = function () {
  var rv = {
    population: 144,
    headsProb: 0.5,
  };

  rv.updateHeadsProb = (headsProb) => {
    rv.headsProb = headsProb;
    updateSliderPos();

    estimates.updateEstimates();
    estimates.render();
  };

  rv.updatePopulation = (population) => {
    rv.population = population;
    updateSliderPos();

    var scale = d3.clamp(0, 13 / Math.sqrt(population), 1);
    sel.studentGroup.st({
      transformOrigin: 'top',
      transformOrigin: c.width / 2 + 'px ' + 160 + 'px',
      transform: `scale(${scale})`,
    });

    estimates.updateEstimates();
    estimates.render();

    sel.student.classed('inactive', (d, i) => i >= population);
  };

  rv.updatePopulationSlider = (val) => {
    rv.updatePopulation(val);
  };

  rv.updateNoiseSlider = (val) => {
    rv.updateHeadsProb(val);
  };

  var updateSliderPos = (function () {
    var width = d3.clamp(50, window.innerWidth / 2 - 40, 145);
    var height = 30;
    var color = '#007276';

    var sliderVals = {
      population: {
        key: 'population',
        textFn: (d) => rv.population + ' students',
        r: [144, 756],
        v: 144,
        stepFn: (d) => rv.updatePopulation(Math.round(d.v / 2) * 2),
      },
      headsProb: {
        key: 'headsProb',
        textFn: (d) => d3.format('.1%')(rv.headsProb) + ' chance of heads',
        r: [0.2, 0.5],
        v: 0.5,
        stepFn: (d) => rv.updateHeadsProb(d.v),
      },
    };
    var sliders = [
      sliderVals.headsProb,
      sliderVals.population,
      sliderVals.headsProb,
    ];
    sliders.forEach((d) => {
      d.s = d3.scaleLinear().domain(d.r).range([0, width]);
    });

    var sliderSel = d3
      .selectAll('.slide-container-population,.slide-container-heads-prob')
      .html('')
      .data(sliders)
      .classed('slider', true)
      .st({
        display: 'inline-block',
        width: width,
        paddingRight: (d, i) => (i == 1 ? 40 : 0),
        marginTop: 20,
      });

    var textSel = sliderSel
      .append('div.slider-label-container')
      .st({marginBottom: -5});

    var svgSel = sliderSel
      .append('svg')
      .at({width, height})
      .on('click', function (d) {
        d.v = d.s.invert(d3.mouse(this)[0]);
        d.stepFn(d);
      })
      .st({
        cursor: 'pointer',
      })
      .append('g')
      .translate(height / 2, 1);
    svgSel
      .append('rect')
      .at({width, height, y: -height / 2, fill: 'rgba(0,0,0,0)'});

    svgSel.append('path').at({
      d: `M 0 -.5 H ${width}`,
      stroke: color,
      strokeWidth: 1,
    });

    var leftPathSel = svgSel.append('path').at({
      d: `M 0 -.5 H ${width}`,
      stroke: color,
      strokeWidth: 3,
    });

    var drag = d3.drag().on('drag', function (d) {
      var x = d3.mouse(this)[0];
      d.v = d3.clamp(d3.min(d.r), d.s.invert(x), d3.max(d.r));
      d.stepFn(d);
    });

    var rectSel = svgSel
      .append('rect')
      .at({
        width: height / 2 - 1,
        height: height / 2 - 1,
        stroke: color,
        strokeWidth: 3,
        fill: '#fff',
      })
      .translate([-height / 4, -height / 4])
      .call(drag);

    return (isDrag) => {
      rectSel.at({x: (d) => Math.round(d.s(rv[d.key]))});
      textSel.text((d) => d.textFn(d));

      leftPathSel.at({d: (d) => `M 0 -.5 H ${d.s(rv[d.key])}`});
    };
  })();
  updateSliderPos();

  return rv;
};

if (window.init) window.init();
