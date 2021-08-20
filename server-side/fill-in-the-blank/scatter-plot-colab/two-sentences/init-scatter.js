/* Copyright 2021 Google LLC. All Rights Reserved.

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


window.hoverCBs = []
window.initScatter = function(){

  function draw(c, data){

    var [svgbot, ctx, svg] = c.layers
    if (!ctx || !ctx.fillRect) return

    data.forEach(d => {
      if (!d.isVisible) return
      d.prettyWord = d.word.replace('▁', '')
      ctx.fillStyle = d.fill
      ctx.fillRect(d.x - d.s/2, d.y - d.s/2, d.s, d.s)
    })

    var curHover = ''
    var hoverSel = svg.append('g.hover').st({opacity: 0, pointerEvents: 'none'})
      
    hoverSel.append('circle')
      .at({r: 5, fill: 'none', stroke: '#000'})
    var hoverTextSel = hoverSel.appendMany('text', [0, 1])
      .at({x: 10, y: 5, stroke: d => d ? '' : '#000'})
      .st({fontFamily: 'monospace'})

    svgbot.append('rect')
      // .at({width: c.width, height: c.height, fill: '#fff'})
    svg.append('rect')
      .at({width: c.width, height: c.height, fill: 'rgba(0,0,0,0)'})

    svg
      .appendMany('text.tiny', data.filter(d => d.show))
      .text(d => d.prettyWord)
      .translate(d => [d.x, d.y])
      .at({
        dy: d => d.show[0] == 'u' ? -2 : 10, 
        dx: d => d.show[1] == 'r' ? 2 : -2, 
        textAnchor: d => d.show[1] == 'r' ? '' : 'end',
        fill: d => d.fill,
      })
      .st({pointerEvents: 'none'})


    svg
      // .call(d3.attachTooltip)
      .on('mousemove', function(){
        var [x, y] = d3.mouse(this)

        var match = _.minBy(data, d => {
          var dx = x - d.x
          var dy = y - d.y

          return dx*dx + dy*dy
        })

        // if (curHover != match.word) return

        hoverCBs.forEach(fn => fn(match.word))
      })
      .on('mouseout', function(){
        hoverCBs.forEach(fn => fn(null))
        curHover = ''
      })

    function setHover(word){
      var d = _.find(data, {word})
      if (!d || isNaN(d.dif)){
        hoverSel.st({opacity: 0})
        hoverTextSel.text('')
        return 
      }
      curHover = word

      hoverSel.translate([d.x, d.y]).raise().st({opacity: 1})
      hoverTextSel.text(d.prettyWord)
    }

    hoverCBs.push(setHover)

  }

  return {draw}
}


if (window.init) init()


