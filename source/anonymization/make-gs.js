window.makeGS = function(){
  var prevSlideIndex = -1
  function updateSlide(i){
    var slide = slides[i]
    if (!slide) return

    d3.select('.tooltip').classed('tooltip-hidden', true)

    var dur = 500

    sel.student.transition('xKey').duration(dur).delay(dur ? slide.circleDelayFn : 0)
      .translate(d => (d.isAdditionalStudent && slide.xKey != 'plagerizedShifted') ? [0,0]: d.pos[slide.xKey])

      
    if (sel.rectAt[slide.xKey]){
      sel.uniqueBox.transition('at').duration(dur)
        .delay(d => dur ? slide.circleDelayFn(d.d0) : 0)
        .at(sel.rectAt[slide.xKey])
        .translate(d => d.d0.group[slide.xKey].pos)
    }

    sel.uniqueBox.transition().duration(dur)
      .st({opacity: slide.showUniqueBox ? 1 : 0})
    
    sel.uniqueSeasonBox.transition()
      .delay((d, i) => slide.showUniqueSeasonBox ? dur*2 + i*40 : 0).duration(slide.showUniqueSeasonBox ? 0 : dur)
      .st({opacity: slide.showUniqueSeasonBox ? 1 : 0})


    if (sliders.headsProb != slide.headsProbTarget && slide.animateHeadsProbSlider != -1){
      var headI = d3.interpolate(sliders.headsProb, slide.headsProbTarget)
      if (window.headSliderTimer) window.headSliderTimer.stop()
      window.headSliderTimer = d3.timer(ms => {
        var dur = slide.animateHeadsProbSlider ? 2000 : 1
        var t = d3.easeCubicInOut(d3.clamp(0, ms/dur, 1))
        sliders.updateHeadsProb(headI(t))
        if (t == 1) headSliderTimer.stop()
      })
    }

    if (sliders.population != slide.populationTarget){
      var popI = d3.interpolate(sliders.population, slide.populationTarget)
      if (window.popSliderTimer) window.popSliderTimer.stop()
      window.popSliderTimer = d3.timer(ms => {
        var dur = slide.animatePopulationSlider ? 2000 : 1
        var t = d3.easeCubicInOut(d3.clamp(0, ms/dur, 1))
        sliders.updatePopulation(Math.round(popI(t)/2)*2)
        if (t == 1) popSliderTimer.stop()
      })
    }

    axii.stateAxis.transition().duration(dur/2)
      .st({opacity: slide.showStateAxis ? 1 : 0})
    axii.ageAxis.transition().duration(dur/2)
      .st({opacity: slide.showAgeAxis ? 1 : 0})
    axii.seasonAxis.transition().duration(dur/2)
      .st({opacity: slide.showSeasonAxis ? 1 : 0})
    axii.headAxis.transition().duration(dur/2)
      .st({opacity: slide.showHeadAxis ? 1 : 0})
    axii.headCaptionAxis.transition().duration(dur/2)
      .st({opacity: slide.showHeadCaptionAxis ? 1 : 0})
    estimates.axisSel.transition().delay(dur).duration(dur/2)
      .st({opacity: slide.showHistogramAxis ? 1 : 0})
    estimates.activeSel.transition().delay(dur).duration(dur/2)
      .st({opacity: slide.showHistogramAxis ? 1 : 0})
    // axii.estimateAxis.transition().delay(dur).duration(dur/2)
    //   .st({opacity: slide.showEstimate && !slide.enterHistogram ? 1 : 0})
    // axii.plagerizedAxis.transition().delay(dur).duration(dur/2)
    //   .st({opacity: slide.showPlagerizedAxis ? 1 : 0})


    annotationSel.transition().duration(dur/2)
      .st({opacity: d => i == d.slide ? 1 : 0})

    estimates.containerSel.transition('xKey').duration(dur/2)
      .st({opacity: slide.showHistogram ? 1 : 0})
    
    if (slide.enterHistogram){
      estimates.render(true)
    } else {
      window.flipAllCoinsTimer._time = Infinity
    }
    if (slide.enterHistogram === 0) estimates.estimateSel.classed('active', 1)


    // Display the default coin flip state if the histogram is not visible.
    sel.flipCircle.transition().duration(dur)
      .at({transform: d => {
        return slide.showFlipCircle && d.coinVals[estimates.active.index] < sliders.headsProb ? 'scale(1)' : 'scale(.1)'}})
    
    prevSlideIndex = i
    slides.curSlide = slide
  }

  var gs = d3.graphScroll()
    .container(d3.select('.container-1'))
    .graph(d3.selectAll('container-1 #graph'))
    .eventId('uniqueId1')
    .sections(d3.selectAll('.container-1 #sections > div'))
    .offset(300)
    .on('active', updateSlide)
}


if (window.init) window.init()
