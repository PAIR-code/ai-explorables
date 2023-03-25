/* Copyright 2020 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/



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
    "parent": "#paint-container-iid",
    "html": "Scribble to update the model (shift-drag erases)",
    "st": {
      "top": 80,
      "left": -170,
      "width": 180
    },
    "minWidth": 850,
    "path": "M 63,-10 A 60.632 60.632 0 0 0 151,59"
  },
  {
    "parent": "#paint-container-ood",
    "html": "Scrub to replay",
    "st": {
      "bottom": -15,
      "right": -190,
      "width": 180
    },
    "minWidth": 900,
    "path": "M 54,-39 A 38.403 38.403 0 0 0 0,-87"
  },
  {
    "parent": "#mnist-ensemble",
    "html": "The ensemble is the average of the confidently incorrect models",
    "st": {
      "top": 383,
      "right": -8,
      "width": 220
    },
    "path": "M 1,-50 A 51.033 51.033 0 0 1 29.999996185302734,-125"
  }
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

    if (d.minWidth && d.minWidth > window.screen.width){
      sel.st({display: 'none'})
    }
    // if (d.mobileSt && 800 > window.screen.width){
    //   sel.st(d.mobileSt)
    // }
    
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











window.initMobileScaling = function(){
  window.graphics = [
    {
      sel: d3.select('#paint-container-iid'),
      ariaLabel: `Input to draw a black & white low resolution digit along with the model's prediction of the current digit and that model's confidence, expressed as a percentage, in that prediction.`,
    },
    {
      sel: d3.select('#paint-container-ood'),
      ariaLabel: `The same diagram, but preset options to draw a shoe or a shirt instead. The model predicts a show is a 2 with 100% confidence!`,
    },
    {
      sel: d3.select('#mnist-ensemble'),
      ariaLabel: `The predictions of 10 models are shown along with an ensemble that takes their average.`,
    },
    {
      sel: d3.select('#ensemble-2d-linear'),
      ariaLabel: `2d plot of 24 red and blue points. There are 10 linear models shown as lines separating the red and blue points, with a red/blue gradient in the middle of the chart where the models disagree.`,
      isResponsive: 1,
    },
    {
      sel: d3.select('#ensemble-2d-piecewise'),
      ariaLabel: `2d plot of 24 red and blue points, with piecewise linear (jagged) lines separating the points. This time the uncertain purple gradient zone extends into the corners where there aren't many points.`,
      isResponsive: 1,
    },
  ]

  graphics.measure = function(d){
    d.sel
      .st({transform: '', height: ''})
      .st({overflow: 'visible'})
      .at({role: 'graphics-document', 'aria-label': d.ariaLabel})

    d.width = d.sel.node().clientWidth
    d.height = d.sel.node().clientHeight
  }
  graphics.forEach(graphics.measure)

  graphics.rescale = function(){
    window.draw_2d()

    graphics.forEach(d => {
      if (d.isResponsive) return

      var scale = d3.clamp(0, (window.screen.width - 10)/d.width, 1)
      d.sel.st({
        transform: `scale(${scale})`,
        transformOrigin: 'left top',
        height: d.height*scale,
      })
    })
  }
  graphics.rescale()
  d3.select(window).on('resize', _.debounce(graphics.rescale, 200))
}
window.initMobileScaling()

