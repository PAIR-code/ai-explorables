window.makeSel = function(){
  function ttFmt(d){
    var ttSel = d3.select('.tooltip').html('')

    var ageStr = d.age + ' year old'
    if (slides.curSlide.index == 4){
      ageStr = ageStr + ' born in the ' + ['spring', 'summer', 'fall', 'winter'][d.season]
    }
    ttSel.append('div').html(`
      ${ageStr} from ${d.state} who 
      ${d.plagerized ? 
        '<span class="highlight purple">plagiarized</span>' : 
        '<span class="highlight grey">never plagiarized</span>'}
    `)

    if (slides.curSlide.index < 6) return

    var isHeads = d.coinVals[estimates.active.index] < sliders.headsProb
    ttSel.append('div').html(`
      They flipped
      ${isHeads ? 'heads' : 'tails'}
      and said they had
      ${d.plagerized || isHeads ? 
        '<span class="highlight purple-box box">plagiarized</span>' : 
        '<span class="highlight grey-box box">never plagiarized</span>'}
    `)
    .st({marginTop: 10})
  }

  var rectAt = {}
  var rs = (axii.bw - 10)*2
  rectAt.ageState = {width: rs, height: rs, x: -rs/2, y: -rs/2}
  var uniqueBox = c.svg.appendMany('rect.unique.init-hidden', students.byAgeState.filter(d => d.length == 1))
    .translate(d => d.pos)
    .at(rectAt.ageState)

  var rs = axii.bw/4 + 5.5
  rectAt.ageStateSeason = {width: rs, height: rs, x: Math.round(-rs/2), y: 4}
  var uniqueSeasonBox = c.svg.appendMany(
    'rect.unique.init-hidden', 
    students.byAgeStateSeason.filter(d => d.length == 1 && d[0].group.ageState.length > 1))
    .translate(d => d.pos)
    .at(rectAt.ageStateSeason)

  // number of uniquely id'd students 
  // console.log(uniqueSeasonBox.size())

  var studentGroup = c.svg.append('g')
    .at({width: 500, height: 500})

  var student = studentGroup.appendMany('g.student', students.all)
    .call(d3.attachTooltip)
    .on('mouseover', ttFmt)
    .translate(d => d.isAdditionalStudent ? [0,0]: d.pos.grid)
    .classed('inactive', d => d.isAdditionalStudent)

  var rs = 16
  var flipCircle = student.append('circle')
    .at({transform: 'scale(.1)'})
    .at({r: 9, fill: '#fff'})
    .at({stroke: '#b0b' })

  var circle = student.append('circle').at({
      r: 5,
      fill: d => d.plagerized ? '#f0f' : '#ccc',
      stroke: d => d.plagerized ? '#b0b' : '#aaa',
      strokeWidth: 1,
    })



  addSwoop(c)
  
  return {student, studentGroup, circle, flipCircle, rectAt, uniqueBox, uniqueSeasonBox}
}


if (window.init) window.init()
