/*
to update arrows:
  1. set isDraggable = true
  2. tweaks arrows by dragging them
  3. run this in the dev tools: 
     copy('window.annotations = ' + JSON.stringify(window.annotations, null, 2))
  4. paste below
*/

window.annotations = [
  {
    "parent": ".central-spam-model > div",
    "html": "Click a message to flag it as spam <ni>❌</ni>",
    "st": {
      "top": 170,
      "left": -150,
      "width": 150
    },
    maxWidth: 950,
    "path": "M 2,1 A 95.13 95.13 0 0 0 140.00006103515625,107.99996948242188",
  },
  {
    "parent": ".secure-aggregation .container > div:last-child .diagram-container",
    "html": "Drag numbers to change what's sent to the server",
    "st": {
      "top": -55,
      "left": 190,
      "width": 140
    },
    "path": "M 137,-20 A 62.78 62.78 0 0 1 45.0000114440918,65"
  },
  {
    "parent": ".playground-step",
    "html": "Click to combine the models without sharing local data",
    "st": {
      "top": 230,
      "left": -10,
      "width": 170
    },
    "path": "M -9,-37 A 122.525 122.525 0 0 1 -10,-267",
    maxWidth: 800,
  },
  {
    "parent": ".playground-step .line-chart",
    "html": `Some users train models that closely match the actual pattern in temperatures; other users train very inaccurate models
    <br><br>The <dark-ul class='dataset'>average accuracy</dark-ul> of all the users' models is also plotted to show how overall performance improves after merging models
    <br><br><span class='global-annotation'>The result of federated training is the latest global model&ensp;<global-circle><svg width="10" height="10"><circle class="global-acc"></circle></svg></global-circle>&ensp; updated on each merge</span>`,
    "st": {
      "top": 30,
      "left": 400,
      "width": 215
    },
    mobileSt: {width: 160},
    "path": "M 0 0"
  },
  {
    "parent": ".playground-outlier",
    "html": `Click the <span class="outlier" style="background: rgb(85, 45, 132); padding: 0px 2px; color: rgb(255, 255, 255);font-style: normal;">outlier</span> users reporting only cold temperatures to retrain without them`,
    "st": {
      "top": 200,
      "left": 0,
      "width": 150
    },
    "path": "M -13,-36 A 91.215 91.215 0 0 1 -18,-213"
  },
  {
    "parent": ".playground-dp",
    "html": "Adjust the privacy level to compare training with and without the outlier",
    "st": {
      "right": 40,
      "top": 201,
      "width": 150,
      "textAlign": "right"
    },
    "path": "M 1,-52 A 51.466 51.466 0 1 1 10.999994277954102,50"
  },
  {
    "parent": ".playground-full",
    "html": "Click to sweep over the number of users",
    "st": {
      "left": 0,
      "top": 340,
      "width": 150
    },
    maxWidth: 800,
    "path": "M -6,-22 A 67.557 67.557 0 0 1 -20,-155"
  },
]



function initSwoopy(){
  d3.selectAll('.annotation-container').remove()

  annotations.forEach(d => {
    var isDraggable = 0

    var sel = d3.select(d.parent)
      .selectAppend('div.annotation-container')
      .classed('is-draggable', isDraggable)
      .html('')
      .st(d.st)

    if (d.maxWidth && d.maxWidth > window.innerWidth){
      sel.st({display: 'none'})
    }
    if (d.mobileSt && 800 > window.innerWidth){
      sel.st(d.mobileSt)
    }
    
    sel.append('div').html(d.html)

    var swoopy = d3.swoopyDrag()
      .x(d => 0).y(d => 0)
      .draggable(isDraggable)
      .annotations([d])

    sel.append('svg').at({width: 1, height: 1})
      .call(swoopy)
    if (isDraggable){
      sel.select('svg').append('circle').at({r: 4, fill: '#f0f'})
    }
  })


  d3.select('body').selectAppend('svg.arrow-svg').html('')
      .st({height: 0})
    .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '-10 -10 20 20')
      .attr('markerWidth', 20)
      .attr('markerHeight', 20)
      .attr('orient', 'auto')
    .append('path')
      .attr('d', 'M-10,-10 L 0,0 L -10,10')
      .st({stroke: '#000', fill: 'none', })


  d3.selectAll('.annotation-container path')
    .at({
      markerEnd: 'url(#arrow)',
      strokeWidth: .5,
      opacity: d => d.path == 'M 0 0' ? 0 : '',
    })
}
initSwoopy()











