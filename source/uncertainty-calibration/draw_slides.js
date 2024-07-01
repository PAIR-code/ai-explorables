window.drawSlides = function () {
  var slides = [
    {
      id: 'intro',
      visible_threshold: 0, //Also sets pointerEvents
      visible_tmessage: 0,
      visible_calibration: 0,
      constant_model_score: 0,
    },
    {
      id: 'thresholding',
      visible_threshold: 1,
      visible_tmessage: 0,
      visible_calibration: 0,
      constant_model_score: 0,
      // target_thresholds: [0, 0.25, 0.35, 0.6, 0.7, 1]
      target_threshold: 0.4,
    },
    {
      id: 'adjustable_thresholding',
      visible_threshold: 1,
      visible_tmessage: 1,
      visible_calibration: 0,
      constant_model_score: 0,
      target_threshold: 0.47,
      // target_thresholds: [0, 0.25, 0.35, 0.6, 0.7, 1]
    },
    {
      id: 'calibration',
      visible_threshold: 0,
      visible_tmessage: 0,
      visible_calibration: 1,
      constant_model_score: 0,
      target_thresholds: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
    {
      id: 'adjusting_calibration',
      visible_threshold: 0,
      visible_tmessage: 0,
      visible_calibration: 1,
      constant_model_score: 0,
      target_thresholds: [0, 0.15, 0.45, 0.55, 0.83, 1],
    },
    // {
    //   id: 'improving_calibration',
    //   visible_threshold: 0,
    //   visible_calibration: 1,
    //   constant_model_score: 1,
    //   target_thresholds: [0, 0.305, 0.407, 0.503, 0.649, 1],
    // },
    {
      id: 'shifting_data',
      visible_threshold: 0,
      visible_tmessage: 0,
      visible_calibration: 1,
      constant_model_score: 1,
      filter_rain: true,
    },
    {
      id: 'beyond_calibration',
      visible_threshold: 0,
      visible_tmessage: 0,
      visible_calibration: 1,
      constant_model_score: 1,
      target_thresholds: [0, 0.02, 0.04, 0.96, 0.98, 1],
    },
  ];

  var prevSlide = null;

  var gs = d3
    .graphScroll()
    .container(d3.select('#container'))
    .graph(d3.selectAll('#container #graph'))
    .eventId('uniqueId1') // namespace for scroll and resize events
    .sections(d3.selectAll('#container #sections > div'))
    .offset(window.isMobile ? 300 : 200)
    .on('active', function (i) {
      try {
        var slide = (slides.slide = slides[i]);

        if (!slide) return console.log(`missing slide ${i}`);

        // if(slide.id != 'slide1'){
        //   weatherGraph.prediction_sel.at({opacity:0});
        // }

        // if(slide.constant_model_score){
        //   weatherGraph.icon_sel.transition().duration(500)
        //   .at({y: constant_score})
        // }
        // else {
        //   weatherGraph.icon_sel.transition().duration(500)
        //   .at({y: d => c.y(d.h)})
        // }

        //weatherGraph.threshold_sel.classed('temp')

        var transition_duration = prevSlide ? 500 : 0;

        // Animate threshold and thresholds between slides
        var durationScale = 1;
        if (prevSlide) {
          durationScale =
            prevSlide.visible_calibration == slide.visible_calibration ? 1 : 3;
        }
        if (slide.target_thresholds) {
          weatherGraph.setThresholds(
            slide.target_thresholds,
            transition_duration * durationScale,
          );
        }
        if (slide.target_threshold) {
          weatherGraph.setThreshold(
            slide.target_threshold,
            transition_duration * durationScale,
          );
        }

        calibrationCurve.renderBuckets();

        weatherGraph.thresholdSel
          .st({pointerEvents: slide.visible_threshold ? 'all' : 'none'})
          .transition()
          .duration(transition_duration)
          .st({opacity: slide.visible_threshold});

        weatherGraph.messageSel
          .transition()
          .duration(transition_duration)
          .st({opacity: slide.visible_tmessage});

        weatherGraph.predictionSel
          .transition()
          .duration(transition_duration)
          .at({strokeOpacity: slide.visible_threshold ? 1 : 0});

        weatherGraph.weatherGroupSel
          .transition()
          .duration(transition_duration)
          .ease(d3.easeBounce)
          .delay((d, i) => Math.random() * transition_duration)
          .st({opacity: (d) => (slide.filter_rain && d.is_filter ? 0 : 1)});

        weatherGraph.thresholdsGroupSel
          .st({pointerEvents: slide.visible_calibration ? 'all' : 'none'})
          .transition()
          .duration(transition_duration)
          .st({opacity: slide.visible_calibration});

        calibrationCurve.c.svg
          .transition()
          .duration(transition_duration)
          .st({opacity: slide.visible_calibration});

        prevSlide = slide;
      } catch (e) {
        console.log(e);
      }
    });

  return slides;
};

if (window.init) window.init();

/*



*/
