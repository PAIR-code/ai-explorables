window.makeAxii = function(){

  var stateScale = d3.scaleBand().domain(states).range(c.x.range())
  var stateAxis = c.svg.append('g.axis.state.init-hidden')

  var bw = stateScale.bandwidth()/2

  stateAxis.appendMany('text', states)
    .translate(d => [stateScale(d) + bw, c.height + 22])
    .text(d => d)
    .at({
      textAnchor: 'middle',
    })
    .st({fill: '#444'})

  stateAxis.appendMany('path', d3.range(ages.length + 1))
    .at({
      d: d => ['M', d*c.width/(ages.length), '0 V', c.height].join(' '),
      stroke: '#aaa',
    })

  stateAxis.append('text.bold').text('Home State')
    .translate([c.width/2, c.height + 45])
    .at({textAnchor: 'middle'})

  var ageScale = d3.scaleBand().domain(ages.slice().reverse()).range(c.x.range())
  var ageAxis = c.svg.append('g.axis.age.init-hidden')

  ageAxis.appendMany('text', ages)
    .translate(d => [-30, ageScale(d) + bw])
    .text(d => d)
    .at({dy: '.33em'})
    .st({fill: '#444'})

  ageAxis.appendMany('path', d3.range(ages.length + 1))
    .at({
      d: d => ['M 0', d*c.width/(ages.length), 'H', c.width].join(' '),
      stroke: '#aaa',
    })

  if (scale == 1){
    ageAxis
      .append('g').translate([-43, c.height/2])
      .append('text.bold').text('Age')
      .at({textAnchor: 'middle', transform: 'rotate(-90)'})
  } else {
    ageAxis
      .append('g').translate([-22, 14])
      .append('text.bold').text('Age')
      .at({textAnchor: 'middle'})
  }

  var seasonAxis = c.svg.append('g.axis.state.init-hidden').lower()
  seasonAxis.appendMany('g', ages)
    .translate(d => ageScale(d), 1)
    .appendMany('path', d3.range(1, 4))
    .at({
      d: d => ['M 0', d*bw/4*2, 'H', c.width].join(' '),
      stroke: '#ddd',
    })

  var headAxis = c.svg.append('g.axis.state.init-hidden')
  headAxis.appendMany('text.bold', ['Heads', 'Tails'])
    .text(d => d)
    .translate((d, i) => [i ? c.width/4*3 + 20 : c.width/4 - 20, 88])
    .at({textAnchor: 'middle'})


  var headCaptionAxis = c.svg.append('g.axis.state.init-hidden')
  headCaptionAxis.appendMany('text', ['reports plagiarism', 'reports truth'])
    .text(d => d)
    .translate((d, i) => [i ? c.width/4*3 + 20 : c.width/4 - 20, 88 + 15])
    .at({textAnchor: 'middle'})
    .st({fill: '#444'})


  return {stateScale, stateAxis, headAxis, headCaptionAxis, ageScale, ageAxis, bw, seasonAxis}
}







if (window.init) window.init()