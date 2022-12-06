window.initUtil = function(){
  function mouseoverZoom(d){
    var size = d.offsetWidth
    var dist = d3.mouse(d).map(d => Math.abs(d - size/2))
    var scale = d3.max(dist)/size*2
    scale = d3.scalePow().exponent(2).range([.5, 1]).clamp(1)(scale)
    d3.select(d).selectAll('img').st({transform: `scale(${1/scale})`})
  }
  function mouseoutZoom(d){
    d3.select(d).selectAll('img')
      .st({transform: `scale(1)`}) 
  }

  return {mouseoverZoom, mouseoutZoom}
}

if (window.init) window.init()