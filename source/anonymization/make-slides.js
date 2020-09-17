window.makeSlides = function(){
  var slides = [
    {
      xKey: 'grid',
      circleDelayFn: d => axii.ageScale(d.age),
      showFlipRect: 0,
      populationTarget: 144,
      headsProbTarget: .5,
    },
    {
      xKey: 'age',
      showAgeAxis: 1,
    },
    {
      xKey: 'ageState',
      showStateAxis: 1,
    },
    {
      showUniqueBox: 1
    },
    {
      xKey: 'ageStateSeason',
      showUniqueBox: 1,
      showUniqueSeasonBox: 1,
      showSeasonAxis: 1,
    },
    {
      xKey: 'heads',
      showUniqueBox: 0,
      showUniqueSeasonBox: 0,
      showSeasonAxis: 0,
      showAgeAxis: 0,
      showStateAxis: 0,
      showHeadAxis: 1,  
    },
    {
      showFlipCircle: 1,
      showHeadCaptionAxis: 1,
    },

    // Flip coin
    {
      xKey: 'plagerizedShifted',
      showHeadAxis: 0,
      showHeadCaptionAxis: 0,
      showHistogramAxis: 1,
    },

    // Exactly how far off can these estimates be after adding noise? Flip more coins to see the distribution.
    {
      enterHistogram: 1,
      showHistogram: 1,
      // showPlagerizedAxis: 0,
      showEstimate: 1,
    },

    // Reducing the random noise increases our point estimate, but risks leaking information about students.
    {
      animateHeadsProbSlider: 1,
      animatePopulationSlider: 1,
      enterHistogram: 0,
      name: 'noise', 
      headsProbTarget: .35,
    },

    // If we collect information from lots of people, we can have high accuracy and protect everyone's privacy.
    {
      showEstimate: 0,
      showAllStudents: 1,
      name: 'population',
      animateHeadsProbSlider: -1,
      animatePopulationSlider: 1,
      populationTarget: 400,
    },

  ]

  var keys = []
  slides.forEach((d, i) => {
    keys = keys.concat(d3.keys(d))
    d.index = i
  })
  _.uniq(keys).forEach(str => {
    var prev = null
    slides.forEach(d => {
      if (typeof(d[str]) === 'undefined'){
        d[str] = prev
      }
      prev = d[str]
    }) 
  })

  return slides
}



if (window.init) window.init()
