!(() => {
  var ttFnSel = d3.select('html').selectAppend('div.tooltip-footnote.tooltip-footnote-hidden')

  function index2superscipt(i){
    return (i + 1 + '')
      .split('')
      .map(num => '⁰¹²³⁴⁵⁶⁷⁸⁹'[num])
      .join('')
  }

  var footendSel = d3.selectAll('.footend')
    .each(function(d, i){
      var sel = d3.select(this)
      var ogHTML = sel.parent().html()

      sel
        .at({href: '#footstart-' + i, id: 'footend-' + i})
        .text(index2superscipt(i))
        .datum(ogHTML)
    })


  footendSel.parent().selectAll('br').remove()

  var footstartSel = d3.selectAll('.footstart')
    .each(function(d, i){
      d3.select(this)
        .at({
          href: '#footend-' + i,
        })
        .text(index2superscipt(i))
        .datum(footendSel.data()[i])
        .parent().at({id: 'footstart-' + i})
        .parent().classed('footstart-p', 1)
    })
    .call(addLockedTooltip)

  function addLockedTooltip(sel, opts={}){
    sel
      .on('mouseover', function(d, i){
        ttFnSel
          .classed('tooltip-footnote-hidden', 0)
          .html(d).select('.footend').remove()
        if (opts.noHover) ttFnSel.style('pointer-events', 'none', 'important')

        var [x, y] = d3.mouse(d3.select('html').node())
        var bb = ttFnSel.node().getBoundingClientRect(),
            left = d3.clamp(20, (x-bb.width/2), window.innerWidth - bb.width - 20),
            top = innerHeight + scrollY > y + 20 + bb.height ? y + 20 : y - bb.height - 10;

        ttFnSel.st({left, top})
      })
      .on('mousemove', mousemove)
      .on('mouseout', mouseout)

    ttFnSel
      .on('mousemove', mousemove)
      .on('mouseout', mouseout)

    function mousemove(){
      if (window.__ttfade) window.__ttfade.stop()
    }

    function mouseout(){
      if (window.__ttfade) window.__ttfade.stop()
      window.__ttfade = d3.timeout(
        () => ttFnSel.classed('tooltip-footnote-hidden', 1).st({pointerEvents: ''}),
        250
      )
    }
  }

  window.addLockedTooltip = addLockedTooltip

})()


