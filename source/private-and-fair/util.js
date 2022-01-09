window.ttSel = d3.select('body').selectAppend('div.tooltip.tooltip-hidden')
window.util = (function(){

  var data = window.__datacache = window.__datacache || {}

  async function getFile(path){
    var [slug, type] = path.split('.')
    if (data[slug]) return data[slug]

    var datadir = 'https://storage.googleapis.com/uncertainty-over-space/explore-dp/'

    var res = await fetch(datadir + path + '?t=5')
    if (type == 'csv'){
      var parsed = d3.csvParse(await res.text())
    } else if (type == 'npy'){
      var parsed = npyjs.parse(await(res).arrayBuffer())
    } else if (type == 'json'){
      var parsed = await res.json()
    } else{
      throw 'unknown type'
    }

    data[slug] = parsed

    return parsed 
  }

  async function drawDigit(ctx, index, s=4, offsetX=0, offsetY=0){
    var digitMetadata = await util.getFile('mnist_train.csv')
    if (!digitMetadata[0].label) decorateDigitMetadata(digitMetadata)

    var {label, labelIndex} = digitMetadata[index]

    if (!label) console.log('missing ', index)
    var rawdigits = await util.getFile(`cns-cache/mnist_train_raw_${label}.npy`)
    if (!rawdigits) return console.log('digits not loaded')

    d3.cross(d3.range(28), d3.range(28)).forEach(([i, j]) => {
      var r = rawdigits.data[labelIndex*28*28 + j*28 + i + 0]
      var g = rawdigits.data[labelIndex*28*28 + j*28 + i + 0]
      var b = rawdigits.data[labelIndex*28*28 + j*28 + i + 0]

      ctx.beginPath()
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.rect(i*s + offsetX, j*s + offsetY, s, s)
      ctx.fill()
    })
  }

  function decorateDigitMetadata(digitMetadata){
    digitMetadata.forEach(d => {
      delete d['']
      d.i = +d.i
      d.label = +d.y
      d.priv_order = +d.priv_order
    })

    var byLabel = d3.nestBy(digitMetadata, d => d.y)
    byLabel = _.sortBy(byLabel, d => d.key)
    byLabel.forEach(digit => {
      digit.forEach((d, i) => d.labelIndex = i)
    })

    return {digitMetadata, byLabel}
  }

  var colors = [d3.interpolateTurbo(.15), d3.interpolateTurbo(.85)]
  var epsilonExtent = [400000, .01]
  // var epsilonExtent = [65, .01]


  var addAxisLabel = (c, xText, yText, xOffset=40, yOffset=-40) => {
    c.svg.select('.x').append('g')
      .translate([c.width/2, xOffset])
      .append('text.axis-label')
      .text(xText)
      .at({textAnchor: 'middle'})
      .st({fill: '#000', fontSize: 14})

    c.svg.select('.y')
      .append('g')
      .translate([yOffset, c.height/2])
      .append('text.axis-label')
      .text(yText)
      .at({textAnchor: 'middle', transform: 'rotate(-90)'})
      .st({fill: '#000', fontSize: 14})
  }

  var ggPlotBg = (c, isBlack=true) => {
    if (!isBlack){
      c.svg.append('rect')
        .at({width: c.width, height: c.height, fill: '#eee'})
        .lower()
    }

    c.svg.selectAll('.tick').selectAll('line').remove()
    c.svg.selectAll('.y .tick')
      .append('path').at({d: 'M 0 0 H ' + c.width, stroke: '#fff', strokeWidth: 1})
    c.svg.selectAll('.y text').at({x: -3})
    c.svg.selectAll('.x .tick')
      .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1})
  }


  return {data, getFile, drawDigit, colors, epsilonExtent, addAxisLabel, ggPlotBg, decorateDigitMetadata}
})()






// mnist_train.csv
// mnist_train_raw.npy
// umap_train_0.npy
// umap_train_1.npy
// umap_train_2.npy
// umap_train_3.npy
// umap_train_4.npy
// umap_train_5.npy
// umap_train_6.npy
// umap_train_7.npy
// umap_train_8.npy
// umap_train_9.npy
// umap_train_all.npy
