
!(async function(){
  var data = await util.getFile('mnist_train.csv')
  data.forEach(d => {
    delete d['']
    d.i = +d.i
  })
  
  var sel = d3.select('.umap-digit').html('')
    .at({role: 'graphics-document', 'aria-label': `Color coded UMAP of MNIST 1s showing that increasing privacy will misclassify slanted and serif “1” digits first.`})

  var umapSel = sel.append('div')
    .append('div.chart-title').text('Sensitivity to higher privacy levels →')
    .parent()
    .st({maxWidth: 600, margin: '0 auto', marginBottom: 10})
    .append('div')


  var buttonSel = sel.append('div.digit-button-container')
    .appendMany('div.button', d3.range(10))
    .text(d => d)
    .on('click', d => drawDigitUmap(d))


  drawDigitUmap(1)


  async function drawDigitUmap(digit){
    buttonSel.classed('active', d => d == digit)

    // var umap = await util.getFile(`umap_train_${digit}.npy`)
    var umap = await util.getFile(`cns-cache/umap_train_784_${digit}.npy`)
    util.getFile(`cns-cache/mnist_train_raw_${digit}.npy`)

    var digitData = data
      .filter(d => d.y == digit)
      .map((d, i) => ({
        rawPos: [umap.data[i*2 + 0], umap.data[i*2 + 1]],
        priv_order: d.priv_order,
        y: d.y,
        i: d.i
      }))

    var c = d3.conventions({
      sel: umapSel.html(''),
      width: 600,
      height: 600,
      layers: 'sdc',
      margin: {top: 45}
    })

    var nTicks = 200
    c.svg.appendMany('rect', d3.range(nTicks))
      .at({
        height: 15,
        width: 1,
        fill: i => d3.interpolatePlasma(i/nTicks),
      })
      .translate(i => [c.width/2 - nTicks/2 - 20 + i, -c.margin.top + 5])


    c.x.domain(d3.extent(digitData, d => d.rawPos[0]))
    c.y.domain(d3.extent(digitData, d => d.rawPos[1]))//.range([0, c.height])
    digitData.forEach(d => d.pos = [c.x(d.rawPos[0]), c.y(d.rawPos[1])])

    c.sel.select('canvas').st({pointerEvents: 'none'})
    var divSel = c.layers[1].st({pointerEvents: 'none'})
    var ctx = c.layers[2]

    digitData.forEach(d => {
      ctx.beginPath()
      ctx.fillStyle = d3.interpolatePlasma(1 - d.priv_order/60000)
      ctx.rect(d.pos[0], d.pos[1], 2, 2)
      ctx.fill()
    })

    var p = 10
    c.svg
      .append('rect').at({width: c.width + p*2, height: c.height + p*2, x: -p, y: -p})
      .parent()
      .call(d3.attachTooltip)
      .on('mousemove', function(){
        var [px, py] = d3.mouse(this)

        var minPoint = _.minBy(digitData, d => {
          var dx = d.pos[0] - px
          var dy = d.pos[1] - py

          return dx*dx + dy*dy
        })

        var s = 4
        var c = d3.conventions({
          sel: ttSel.html('').append('div'),
          width: 4*28,
          height: 4*28,
          layers: 'cs',
          margin: {top: 0, left: 0, right: 0, bottom: 0}
        })

          // <div>Label: ${minPoint.y}</div>
        // ttSel.append('div').html(`
        //   <div>Privacy Rank ${d3.format(',')(minPoint.priv_order)}</div>
        // `)

        ttSel.classed('tooltip-footnote', 0).st({width: 112})

        util.drawDigit(c.layers[0], +minPoint.i, s)
      })

    if (digit == 1){
      var circleDigits = [
        {r: 40, index: 1188},
        {r: 53, index: 18698},
        {r: 40, index: 1662}
      ]
      circleDigits.forEach(d => {
        d.pos = digitData.filter(e => e.priv_order == d.index)[0].pos
      })

      c.svg.append('g')
        .appendMany('g', circleDigits)
        .translate(d => d.pos)
        .append('circle')
        .at({r: d => d.r, fill: 'none', stroke: '#fff', strokeDasharray: '2 3', strokeWidth: 1})

      var {r, pos} = circleDigits[0]


      divSel
        .append('div').translate(pos)
        .append('div').translate([r + 20, -r + 10])
        .st({width: 150, fontWeight: 300, fontSize: 14, color: '#fff', xbackground: 'rgba(255,0,0,.2)', lineHeight: '1.2em'})
        .text('Increasing privacy will misclassify slanted and serif “1” digits first')
    }
  }
})()


