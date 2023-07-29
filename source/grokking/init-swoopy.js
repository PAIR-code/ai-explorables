/* Copyright 2023 Google LLC. All Rights Reserved.

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
     copy('var annotations = ' + JSON.stringify(window.annotations, null, 2))
  4. paste in the init file
*/


window.initSwoopy = function(annotations){
  // d3.selectAll('.annotation-container').remove()

  annotations.forEach(d => {
    var isDraggable = !!annotations.isDraggable

    var sel = d3.select(d.parent)
      .append('div.annotation-container')
      .classed('is-draggable', isDraggable)
      .html('')
      .st(d.st)

    if (d.class) d.class.split(' ').forEach(str => sel.classed(str, 1))

    if (d.minWidth && d.minWidth > window.innerWidth){
      sel.st({display: 'none'})
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

window.initModTop?.()
// window.initSparseParity?.()
// window.initModBot?.()
