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


