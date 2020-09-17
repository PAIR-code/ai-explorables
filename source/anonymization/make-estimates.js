window.makeEstimates = function(){ 
  var estimateScale = d3.scaleLinear()
    .domain([.5 - .15, .5 + .15]).range([0, c.width])
    .interpolate(d3.interpolateRound)

  var jitterHeight = 90
  var rs = 4 // rect size

  var estimates = students[0].coinVals.map(d => ({val: .5, pctHead: .25, x: c.width/2, y: c.height - jitterHeight/2}))
  var simulation = d3.forceSimulation(estimates)
    .force('collide', d3.forceCollide(rs).strength(.1))
    .stop()

  function updateEstimates(){
    var selectedStudents = students.all.slice(0, sliders.population)
    
    selectedStudents[0].coinVals.map((_, i) => {
      estimates[i].pctHead = d3.mean(selectedStudents, d => (d.coinVals[i] < sliders.headsProb) || d.plagerized)

      estimates[i].val = (1 - estimates[i].pctHead)/(1 - sliders.headsProb)
    })
    updateSimulation(60)
  }  
  updateEstimates()

  function updateSimulation(ticks=80, yStrength=.005){
    var variance = d3.variance(estimates, d => d.val)
    var xStength = variance < .0005 ? .3 : .1

    estimates.forEach(d => d.targetX = estimateScale(d.val))

    simulation
      .force('x', d3.forceX(d => d.targetX).strength(xStength))
      .force('y', d3.forceY(c.height - jitterHeight/2).strength(yStrength))
      .alpha(1)
      // .alphaDecay(1 - Math.pow(0.001, 1/ticks))

    for (var i = 0; i < ticks; ++i) simulation.tick()

    estimates.forEach(d => {
      d.x = Math.round(d.x)
      d.y = Math.round(d.y)
    })
  }
  updateSimulation(80, 1)
  updateSimulation(80, .005)


  // Set up DOM 
  var histogramSel = c.svg.append('g').translate([0, -25])
  var axisSel = histogramSel.append('g.axis.state.init-hidden')
  var histogramAxis = axisSel.append('g')

  var numTicks = 6
  var xAxis = d3.axisTop(estimateScale).ticks(numTicks).tickFormat(d3.format('.0%')).tickSize(100)

  histogramAxis.call(xAxis).translate([.5, c.height + 5])
  middleTick = histogramAxis.selectAll('g').filter((d, i) => i === 3)
  middleTick.select('text').classed('bold', 1)
  middleTick.select('line').st({stroke: '#000'})
  
  histogramAxis.append('text.bold')
    .text('actual non-plagiarism rate')
    .translate([c.width/2, 11])
    .st({fontSize: '10px'})

  var containerSel = histogramSel.append('g#histogram').translate([0.5, .5])


  // Selection overlay to highlight individual estimates.
  var selectSize = rs*2 + 2
  var selectColor = '#007276'
  var rectFill = '#007276'

  var activeSel = histogramSel.append('g.active.init-hidden.axis')
    .st({pointerEvents: 'none'})

  activeSel.append('rect')
    .at({width: selectSize, height: selectSize, stroke: selectColor, fill: 'none', strokeWidth: 3})
    .translate([-selectSize/2, -selectSize/2])

  var activeTextHighlight = activeSel.append('rect')
    .at({x: -32, width: 32*2, height: 18, y: -25, fill: 'rgba(255,255,255,.6)', rx: 10, ry: 10, xfill: 'red'})

  var activeTextSel = activeSel.append('text.est-text.bold')
    .text('34%')
    .at({textAnchor: 'middle', textAnchor: 'middle', y: '-1em'})
    .st({fill: selectColor})

  var activePathSel = activeSel.append('path')
    .st({stroke: selectColor, strokeWidth: 3})


  // Update highlight DOM with current highlight
  var curDrawData = {pctHead: .25, val: .5, x: c.width/2, y: c.height - jitterHeight/2}
  function setActive(active, dur=0){
    if (active !== estimates.active){
      estimates.forEach(d => {
        d.active = d == active
        d.fy = d.active ? d.y : null
      })
      estimates.active = active
    }

    students.updateHeadsPos()


    sel.flipCircle
      .transition().duration(0).delay(d => d.i*5*(dur > 0 ? 1 : 0))
      .at({transform: d => slides && slides.curSlide && slides.curSlide.showFlipCircle && d.coinVals[active.index] < sliders.headsProb ? 
        'scale(1)' : 'scale(.1)'})


    flipCoinTimer.stop()
    if (dur){
      var objI = d3.interpolateObject(curDrawData, active)

      flipCoinTimer = d3.timer(ms => {
        var t = d3.easeCubicInOut(d3.clamp(0, ms/dur, 1))
        drawData(objI(t))
        if (t == 1) flipCoinTimer.stop()
      })
    } else{
      drawData(active)
    }
    
    function drawData({pctHead, val, x, y}){
      activeSel.translate([x + rs/2, y + rs/2])
      activeTextSel.text('est. ' + d3.format('.1%')(val))
      activePathSel.at({d: `M ${selectSize/2*Math.sign(c.width/2 - x)} -1 H ${c.width/2 - x}`})

      var error = Math.abs(val - .5)
      var fmt = d3.format(".1%")
      var pop = sliders.population
      d3.select('.rand-text')
        // .html(`${fmt(1 - pctHead)} of students said they had never plagerized. Since about half the students flipped heads and automatically reported plagerizism, we double that to <span class='highlight square blue-box box'>estimate ${fmt(val)}</span> of students haven't plagerized—${error > .1 ? '' : error > .07 ? 'a little ' : 'not '}far from the actual rate of ${fmt(.5)}`)
        // .html(`${Math.round((1 - pctHead)*pop)} of ${pop} students said they had never plagiarized. Since about half the students flipped heads and automatically reported plagiarism, we double that rate to <span class='highlight square blue-box box'>estimate ${fmt(val)}</span> of students haven't plagiarized—${error > .4 ? '' : error > .07 ? 'a little ' : 'not '}far from the actual rate of ${fmt(.5)}`)
        .html(`Here, ${fmt(1 - pctHead)} students said they had never plagiarized. Doubling that, we <span class='highlight square blue-box box'>estimate ${fmt(val)}</span> of students haven't plagiarized—${error > .1 ? 'quite ' : error > .07 ? 'a little ' : 'not '}far from the actual rate of ${fmt(.5)}`)

      curDrawData = {pctHead, val, x, y}
    }
  }
  window.flipCoinTimer = d3.timer(d => d)



  var estimateSel = containerSel.appendMany('rect.estimate', estimates)
    .at({width: rs, height: rs, stroke: '#fff', fill: rectFill, strokeWidth: .5})
    .st({fill: rectFill})
    .translate([rs/2, rs/2])
    .on('mouseover', (d, i) => {
      if (window.slides.curSlide.showHistogram) {
        setActive(d)
      }
    })

  function setSelectorOpacity(textOpacity, strokeOpacity) {
    activeTextSel.st({opacity: textOpacity})
    activeSel.st({opacity: strokeOpacity})
    activePathSel.st({opacity: strokeOpacity})
  }

  function render(transition=false){
    estimateSel.translate(d => [d.x, d.y])
    setActive(estimates.active)

    if (transition){
      if (window.flipAllCoinsTimer) window.flipAllCoinsTimer.stop()
      window.flipAllCoinsTimer = d3.timer(ms => {
        var t = d3.easeExpIn(d3.clamp(0, ms/5000, 1), 20)
        if (flipAllCoinsTimer.forceEnd) t = 1
        
        if (t > .028) {
          setSelectorOpacity(textOpacity=0, strokeOpacity=0.7)
        }

        var index = Math.floor((estimates.length - 2)*t) + 1
        estimateSel.classed('active', (d, i) => i <= index)

        setActive(estimates[index])
        // flipCoinsSel.text('Flip coins ' + d3.format('03')(index < 100 ? index : index + 1) + ' times')
        flipCoinsSel.text('Flip coins 200 times')

        if (t == 1) {
          flipAllCoinsTimer.stop()
          setSelectorOpacity(textOpacity=1, strokeOpacity=1)
        }
      })
    } else {
      setSelectorOpacity(textOpacity=1, strokeOpacity=1)
      flipCoinsSel
    }   
  }
  window.flipAllCoinsTimer = d3.timer(d => d)


  var flipCoinsSel = d3.select('.flip-coins').on('click', () => {
    students.all.forEach(student => {
      student.coinVals = student.coinVals.map(j => Math.random())
    })

    updateEstimates()
    render(true)
  })

  d3.select('.flip-coins-once').on('click', flipCoin)
  function flipCoin(){
    active = estimates[0]

    students.all.forEach(student => {
      student.coinVals = student.coinVals.map(j => Math.random())
    })

    active.fy = active.y = c.height - jitterHeight/2
    updateEstimates()

    estimateSel.translate(d => [d.x, d.y])
    estimates.active = null
    setActive(active, 1000)
  }

  Object.assign(estimates, {updateEstimates, setActive, render, flipCoin, axisSel, containerSel, estimateSel, activeSel})

  return estimates
} 
    
if (window.init) window.init()