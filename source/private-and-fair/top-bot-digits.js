
!(async function(){
  await util.getFile(`cns-cache/mnist_train_raw_3.npy`)
  var digitMetadata = await util.getFile('mnist_train.csv')
  var {byLabel} = util.decorateDigitMetadata(digitMetadata)

  var sel = d3.select('.top-bot-digits').html('')
      .at({role: 'graphics-document', 'aria-label': `The twenty-five MNIST 3 digits most and least senstive to higher and lower privacy. The digits most sensitive to higher privacy are much more poorly drawn than the onces least sensitive to higher privacy.`})

  var digitSel = sel.append('div')
  var buttonSel = sel.append('div.digit-button-container')
    .appendMany('div.button', d3.range(10))
    .text(d => d)
    .on('click', d => drawClass(byLabel[d]))

  drawClass(byLabel[3])

  async function drawClass(digitClass){
    buttonSel.classed('active', d => d == digitClass.key)
    await util.getFile(`cns-cache/mnist_train_raw_${digitClass.key}.npy`)

    var nRows = 5
    var nCols = 5

    var bot = _.sortBy(digitClass, d => +d.priv_order).slice(0, nRows*nCols)
    var top = _.sortBy(digitClass, d => -d.priv_order).slice(0, nRows*nCols)
    
    digitSel.html('').append('div')
      .st({maxWidth: 640, margin: '0 auto'})
      .appendMany('div', [bot, top])
      .st({display: 'inline-block'})
      .each(drawDigitBlock)


    function drawDigitBlock(digits, isBot){
      var s = 2

      var sel = d3.select(this).append('div')

      var c = d3.conventions({
        sel,
        width: s*29*nCols,
        height: s*29*nRows,
        layers: 'cs',
        margin: {top: 30, bottom: 10, right: 10, left: 10}
      })

      var ctx = c.layers[0]

      digits.forEach((d, i) => {
        util.drawDigit(
          ctx, 
          +d.i, 
          s,
          (i % nCols)*s*29,
          Math.floor(i/nCols)*s*29
        )
      })

      c.svg.append('text')
        .text(isBot ? 'Least sensitive to higher privacy' : 'Most sensitive to higher privacy')
        .at({dy: '-.4em', textAnchor: 'middle', x: c.width/2, fontWeight: 600, fontSize: 14})
    }
  }

})()