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



var annotations = 
[
]


function addSwoop(c){
  var swoopy = d3.swoopyDrag()
    .x(d => c.x(d.x))
    .y(d => c.y(d.y))
    .draggable(0)
    .annotations(annotations)

  var swoopySel = c.svg.append('g.annotations').call(swoopy)

  c.svg.append('marker#arrow')
      .attr('viewBox', '-10 -10 20 20')
      .attr('markerWidth', 20)
      .attr('markerHeight', 20)
      .attr('orient', 'auto')
    .append('path').at({d: 'M-6.75,-6.75 L 0,0 L -6.75,6.75'})


  swoopySel.selectAll('path').attr('marker-end', 'url(#arrow)')
  window.annotationSel = swoopySel.selectAll('g')
    .st({fontSize: 12, opacity: d => d.slide == 0 ? 1 : 0})

  swoopySel.selectAll('text')
    .each(function(d){
      d3.select(this)
        .text('')                        //clear existing text
        .tspans(d3.wordwrap(d.text, d.width || 20), 12) //wrap after 20 char
    })  
}


