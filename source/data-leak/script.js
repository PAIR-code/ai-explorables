console.clear()

var isMobile = innerWidth < 1000
d3.select('body').classed('is-mobile', isMobile)

var colors = ['#FDE100', '#EE2737' ]
var colors = ['#FDE100', '#8e068e' ]
// var colors = ['#2979FF', '#FF6D00']
// var colors = ['#2979FF', '#FDD835']
// var colors = ['#f1a340', '#998ec3' ]

var color2dark = {
  '#FDE100': d3.color('#FDE100').darker(.2),
  '#8e068e': d3.color('#8e068e').darker(2),
}

var colorScale = d3.interpolate(colors[0], colors[1])

var s = d3.select('#field-grass').node().offsetWidth/120

var width = 120*s
var height = Math.floor(75*s)

var cs = 20
var cells = d3.cross(
  d3.range(0, width + cs, cs), 
  d3.range(0, height + cs, cs))



globalPlayers = decoratePlayers(players0)
globalPlayersH = decoratePlayers(playersleaklow)

function decoratePlayers(rawPlayers){
  var players = rawPlayers.map(d => d.map(d => d*s))
  players.forEach((d, i) => {
    d.color = i < 11 ? colors[0] : colors[1]
    d.isRed = i < 11 ? 1 : 0
    d.i = i
  })

  players.renderFns = []
  players.renderAll = () => players.renderFns.forEach(d => d())

  return players
}

var playerOptions0 = [players1, players2, players0]
var playerOptions1 = [playersleaklow, playersleakhigh]

// addPlayAnimation(globalPlayers, '#field-grass', playerOptions0, 'mouseenter')
addPlayAnimation(globalPlayers, '#player-button', playerOptions0)
addPlayAnimation(globalPlayersH, '#high-button', playerOptions1, 'click', true)

function addPlayAnimation(players, selStr, playerOptions, eventStr='click', loop=false){
  if (loop) {
    window.loopInterval = d3.interval(playAnimation, 2500)
  }
  if (selStr) {
    d3.selectAll(selStr).on(eventStr, function() {
      if (loop) window.loopInterval.stop() // stop looping if the higher-or-lower button is pressed
      playAnimation()
    })
  }

  var curPlayerIndex = 0
  function playAnimation(){
    curPlayerIndex++
    curPlayerIndex = curPlayerIndex % playerOptions.length

    var nextPlayers = playerOptions[curPlayerIndex]
      .map(d => d.map(d => d*s))

    var interpolates = players
      .map((d, i) => d3.interpolate(d, nextPlayers[i]))

    var dur = 1000
    if (playerOptions.animationTimer) playerOptions.animationTimer.stop()
    playerOptions.animationTimer = d3.timer(time => {
      var t = d3.clamp(0, time/dur, 1)

      interpolates.forEach((interpolate, i) => {
        var [x, y] = interpolate(t)

        players[i][0] = x
        players[i][1] = y
      })

      players.renderAll(t)

      if (t == 1) playerOptions.animationTimer.stop()
    })
  }
}

function stopAnimations(){
  if (playerOptions0.animationTimer) playerOptions0.animationTimer.stop()
  if (playerOptions1.animationTimer) playerOptions1.animationTimer.stop()
}


function initField(name){
  var marginBottom = 30
  var marginTop = 35
  var sel = d3.select('#field-' + name).html('').classed('field', true)
    .st({marginBottom: marginBottom, marginTop: marginTop})

  window.c = d3.conventions({
    sel,
    margin: {top: 0, left: 0, right: 0, bottom: 0},
    width,
    height,
    layers: 'dcs'
  })

  var [divSel, ctx, svg] = c.layers

  c.svg = c.svg.append('g').translate([.5, .5])

  var isRegression = name.includes('regression')
  var isVisiblePoints = name != 'playerless'

  var pointName = isRegression || name == 'scatter' ? ' People' : ' Players'
  var buttonSel = sel.append('div.button')
    .st({top: pointName == ' People' ? 28 : -8, right: -8, position: 'absolute', background: '#fff'})
    .text((isVisiblePoints ? 'Hide' : 'Show') + pointName)
    .on('click', () => {
      isVisiblePoints = !isVisiblePoints
      buttonSel.text((isVisiblePoints ? 'Hide' : 'Show') + pointName)
      playerSel.st({opacity: isVisiblePoints ? 1 : 0})
      textSel.st({opacity: isVisiblePoints ? 1 : 0})
    })

  if (name == 'grass'){
    c.svg.append('rect').at({width, height, fill: '#34A853'})
    divSel.append('div.pointer').append('div')
  }

  var roundNum = d => isNaN(d) ? d : Math.round(d)
  var chalkSel = c.svg.append('g')
  chalkSel.append('path.white')
    .at({d: ['M', Math.round(width/2), 0, 'V', height].map(roundNum).join(' '),})
  chalkSel.append('circle.white')
    .at({r: 10*s}).translate([width/2, height/2])
  chalkSel.append('path.white')
    .at({d: ['M', 0, (75 - 44)/2*s, 'h', 18*s, 'v', 44*s, 'H', 0].map(roundNum).join(' '),})
  chalkSel.append('path.white')
    .at({d: ['M', width, (75 - 44)/2*s, 'h', -18*s, 'v', 44*s, 'H', width].map(roundNum).join(' '),})

  var drag = d3.drag()
    .on('drag', function(d){
      stopAnimations()
      if (name === 'regression-leak') {
        window.loopInterval.stop()
      }

      d[0] = Math.round(Math.max(0, Math.min(width,  d3.event.x)))
      d[1] = Math.round(Math.max(0, Math.min(height, d3.event.y)))

      players.renderAll()
    })
    .subject(function(d){ return {x: d[0], y: d[1]} })


  var players = name == 'regression-leak' ? globalPlayersH : globalPlayers

  if (isRegression){
    var byColor = d3.nestBy(players, d => d.color)
    var regressionSel = c.svg.appendMany('path', byColor)
      .at({stroke: d => color2dark[d.key], strokeWidth: 3.5, strokeDasharray: '4 4'})
      .each(function(d){ d.sel = d3.select(this) })
  }

  var bgPlayerSel = c.svg.appendMany('circle.player', players)
    .at({r: 15, fill: d => d.color, opacity: 0})
    .translate(d => d)
    .call(drag)

  var playerSel = c.svg.appendMany('circle.player', players)
    .at({r: 5, fill: d => d.color, opacity: isVisiblePoints ? 1 : 0})
    .translate(d => d)
    .call(drag)

  var textSel = c.svg.appendMany('text.chart-title', name == 'playerless' ? [players[0], players[20]] : [players[0]])
    .text(name == 'regression-leak' || name == 'scatter' ? 'New Hire' : name == 'playerless' ? 'Goalie' : '')
    .st({pointerEvent: 'none'})
    .at({dy: '.33em', opacity: isVisiblePoints ? 1 : 0, dx: (d, i) => i ? -8 : 8, textAnchor: (d, i) => i ? 'end' : 'start'})

  if (name == 'scatter' || isRegression){
    sel.st({marginBottom: marginBottom + 70})
    sel.insert('div.axis.chart-title', ':first-child') 
      .html(`
        <span style='background: ${colors[0]}'>Men's</span>
        and 
        <span style='background: ${colors[1]}'>Women's</span> 
        Salaries`)
      .st({marginBottom: 10, fontSize: 16})

    c.x.domain([0, 20])
    c.y.domain([40000, 90000])

    c.xAxis.ticks(5)
    c.yAxis.ticks(5).tickFormat(d => {
      var rv = d3.format(',')(d).replace('9', '$9')
      if (isMobile){
        rv = rv.replace(',000', 'k').replace('40k', '')
      }

      return rv
    })



    chalkSel.selectAll('*').remove()
    chalkSel.appendMany('path.white', c.x.ticks(5))
      .at({d: d => ['M', Math.round(c.x(d)), '0 V ', c.height].join(' ')})

    chalkSel.appendMany('path.white', c.y.ticks(5))
      .at({d: d => ['M 0', Math.round(c.y(d)), 'H', c.width].join(' ')})

    d3.drawAxis(c)
    c.svg.selectAll('.axis').lower()
    if (isMobile){
      c.svg.selectAll('.y text')
        .translate([35, 10])
        .st({fill: name == 'scatter' ? '#000' : ''})

      c.svg.selectAll('.x text').filter(d => d == 20).at({textAnchor: 'end'})
      c.svg.selectAll('.x text').filter(d => d == 0).at({textAnchor: 'start'})
    }
    

    c.svg.select('.x').append('text.chart-title')
      .text('Years at Company →')
      .translate([c.width/2, 43])
      .at({textAnchor: 'middle'})
  }



  render()
  players.renderFns.push(render)
  function render(){
    renderSVG()
    if (name != 'grass' && !isRegression)renderCanvas()
    if (isRegression) renderRegression()
  }

  function renderSVG(){
    if (playerSel){
      playerSel.translate(d => d)
      bgPlayerSel.translate(d => d)
      textSel.translate(d => d)
    }
  }

  function renderCanvas(){
    cells.forEach(d => {
      players.forEach(p => {
        var dx = p[0] - d[0] - cs/2
        var dy = p[1] - d[1] - cs/2

        // p.dist = Math.sqrt(dx*dx + dy*dy)
        // p.dist = dx*dx + dy*dy
        p.dist = Math.pow(dx*dx + dy*dy, 1.5) + .00001
        p.weight = 1/p.dist

        return p.dist
      })

      var sum = d3.sum(players, d => d.isRed*d.weight)
      var wsum = d3.sum(players, d => d.weight)

      ctx.fillStyle = colorScale(1 - sum/wsum)

      ctx.fillRect(d[0], d[1], cs, cs)
    })
  }

  function renderRegression(){
    byColor.forEach(d => {
      var l = ss.linearRegressionLine(ss.linearRegression(d))

      var x0 = 0
      var x1 = c.width

      d.sel.at({d: `M ${x0} ${l(x0)} L ${x1} ${l(x1)}`})
    })
  }
}

'grass prediction playerless scatter regression regression-leak'
  .split(' ')
  .forEach(initField)


