d3.select('body').selectAppend('div.tooltip.tooltip-hidden')

window.ages =   '18 19 20 21 22'.split(' ')
window.states = 'RI NH NY CT VT'.split(' ')

window.init = function(){
  // console.clear()
  var graphSel = d3.select('#graph').html('').append('div')
  window.c = d3.conventions({
    sel: graphSel,
    width: 460,
    height: 460,
  })

  function sizeGraphSel(){
    var clientWidth = d3.select('body').node().clientWidth

    window.scale = d3.clamp(1, (c.totalWidth + 35)/(clientWidth - 10), 2) // off by one, s is 35

    graphSel.st({
      transform: `scale(${1/scale})`,
      transformOrigin: `0px 0px`,
    })

    d3.select('#graph').st({height: scale == 1 ? 500 : 710})
  }
  sizeGraphSel()
  d3.select(window).on('resize', sizeGraphSel)


  c.svg = c.svg.append('g').translate([.5, .5])

  window.axii = makeAxii()
  window.sliders = makeSliders()
  window.students = makeStudents()
  window.sel = makeSel()
  window.slides = makeSlides()
  window.estimates = makeEstimates()




  var error = 0
  while (error < .02 || error > .05){
    estimates.flipCoin()
    error = Math.abs(estimates.active.val - .5)
  }

  makeGS()
}

init()

























