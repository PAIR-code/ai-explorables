!(async function(){
  var data = await util.getFile('cns-cache/model_grid_test_accuracy.json')

  data = data
    .filter(d => util.epsilonExtent[1] <= d.epsilon && d.epsilon <= util.epsilonExtent[0])
    .filter(d => d.dataset_size > 1000)

    // .filter(d => d.dataset_size > 4000)

  // console.log(data)

  var bySize = d3.nestBy(data, d => d.dataset_size)
  bySize.forEach((d, i) => {
    d.dataset_size = d.key

    d.color = d3.interpolatePlasma(.84- i/6)
    if (d.key == 60000){
      d3.selectAll('.tp60').st({background: d.color, padding: 2})
    }
    if (d.key == 7500){
      d3.selectAll('.tp75').st({background: d.color, color: '#fff', padding: 2})
    }

    d.label = {
      60000: {pos: [7, 11], textAnchor: 'middle', text: '60,000'},
      30000: {pos: [7, 11], textAnchor: 'middle', text: '30,000'},
      15000: {pos: [7, -5], textAnchor: 'start', text: '15,000'},
      7500: {pos: [0, 8], textAnchor: 'start', text: '7,500'},
      // 3750: {pos: [0, 14], textAnchor: 'end', text: '3,750 training points'},
      3750: {pos: [-34, 10], textAnchor: 'start', text: '3,750'},
      2000: {pos: [-50, 10], textAnchor: 'end', text: '2,000 training points'},
    }[d.key]

    d.forEach(e => e.size = d)
  })

  var sel = d3.select('.accuracy-v-privacy-dataset_size').html('')
    .at({role: 'graphics-document', 'aria-label': `High privacy and accuracy requires more training data. Line chart showing too much differential privacy without enough data decreases accuracy.`})

  sel.append('div.chart-title').text('High privacy and accuracy requires more training data')

  var c = d3.conventions({
    sel,
    height: 400,
    margin: {bottom: 125, top: 5},
    layers: 'sd',
  })

  c.x = d3.scaleLog().domain(util.epsilonExtent).range(c.x.range())
  c.xAxis = d3.axisBottom(c.x).tickFormat(d => {
    var rv = d + ''
    if (rv.split('').filter(d => d !=0 && d != '.')[0] == 1) return rv
  })

  c.yAxis.tickFormat(d => d3.format('.0%')(d))//.ticks(8)

  d3.drawAxis(c)
  util.addAxisLabel(c, 'Higher Privacy →', 'Test Accuracy')
  util.ggPlotBg(c, false)
  c.layers[1].append('div')
    .st({fontSize: 12, color: '#555', width: 120*2, textAlign: 'center', lineHeight: '1.3em'})
    .translate([c.width/2 - 120, c.height + 70])
    .html('in ε, a <a href="https://desfontain.es/privacy/differential-privacy-in-more-detail.html">measure</a> of how much modifying a single training point can change the model (models with a lower ε are more private)')


  c.svg.selectAll('.y .tick').filter(d => d == .9)
    .select('text').st({fontWeight: 600}).parent()
    .append('path')
    .at({stroke: '#000', strokeDasharray: '2 2', d: 'M 0 0 H ' + c.width})

  var line = d3.line()
    .x(d => c.x(d.epsilon))
    .y(d => c.y(d.accuracy))
    .curve(d3.curveMonotoneX)


  var lineSel = c.svg.append('g').appendMany('path.accuracy-line', bySize)
    .at({
      d: line,
      fill: 'none',
    })
    .st({ stroke: d => d.color, })
    .on('mousemove', setActiveDigit)

  var circleSel = c.svg.append('g')
    .appendMany('g.accuracy-circle', data)
    .translate(d => [c.x(d.epsilon), c.y(d.accuracy)])
    .on('mousemove', setActiveDigit)
    // .call(d3.attachTooltip)

  circleSel.append('circle')
    .at({r: 4, stroke: '#fff'})
    .st({fill: d => d.size.color })


  var labelSel = c.svg.appendMany('g.accuracy-label', bySize)
    .translate(d => [c.x(d[0].epsilon), c.y(d[0].accuracy)])
  labelSel.append('text')
    .filter(d => d.label)
    .translate(d => d.label.pos)
    .st({fill: d => d.color, fontWeight: 400})
    .at({textAnchor: d => d.label.textAnchor, fontSize: 14, fill: '#000', dy: '.66em'})
    .text(d => d.label.text)
    .filter(d => d.key == 2000)
    .text('')
    .tspans(d => d.label.text.split(' '))


  c.svg.append('text.annotation')
    .translate([225, 106])
    .tspans(d3.wordwrap('With limited data, adding more differential privacy improves accuracy...', 25), 12)

  c.svg.append('text.annotation')
    .translate([490, 230])
    .tspans(d3.wordwrap(`...until it doesn't`, 20))

  // setActiveDigit({dataset_size: 60000})
  function setActiveDigit({dataset_size}){
    lineSel
      .classed('active', 0)
      .filter(d => d.dataset_size == dataset_size)
      .classed('active', 1)
      .raise()

    circleSel
      .classed('active', 0)
      .filter(d => d.dataset_size == dataset_size)
      .classed('active', 1)
      .raise()

    labelSel
      .classed('active', 0)
      .filter(d => d.dataset_size == dataset_size)
      .classed('active', 1)
  }
})()




// aVal: 0.5
// accuracy: 0.8936
// accuracy_0: 0.9663265306122449
// accuracy_1: 0.9806167400881057
// accuracy_2: 0.9011627906976745
// accuracy_3: 0.8633663366336634
// accuracy_4: 0.8859470468431772
// accuracy_5: 0.8733183856502242
// accuracy_6: 0.9384133611691023
// accuracy_7: 0.8657587548638133
// accuracy_8: 0.8059548254620124
// accuracy_9: 0.8434093161546086
// dataset_size: 60000
// epochs: 4
// epsilon: 0.19034890168775565
// l2_norm_clip: 0.75
// noise_multiplier: 2.6
