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








window.makeSlider = function(){

  var width = 300
  var height = 30

  var x = d3.scaleLinear()
    .domain([.99, .6])
    .range([0, width])
    .clamp(true)

  var rv = {}
  rv.threshold = .5
  rv.setSlider = makeSetSlider(students, 'threshold')
  rv.setSliderF = makeSetSlider(students.filter(d => !d.isMale), 'threshold_f')
  rv.setSliderM = makeSetSlider(students.filter(d => d.isMale), 'threshold_m')

  var allActiveSel = d3.selectAll('.threshold-rect')
  var allHandleSel = d3.selectAll('.threshold-handle')

  var gatedSel = d3.select('.gated')

  function makeSetSlider(data, key){
    var text = key.split('_')[1]


    var drag = d3.drag()
      .on('drag', function(d){
        updateThreshold(x.invert(d3.mouse(this)[0]))
        // console.log(d3.event.x)

        if (text && slider.threshold_f && (slider.threshold_f > 0.9042 || slider.threshold_f - slider.threshold_m > .05)){
          gatedSel.classed('opened', 1)
          svg.classed('no-blink', 1)
        }

        if (key == 'threshold') svg.classed('no-blink', 1)
      })

    var svg = d3.select('.slider.' + key).html('')
      .append('svg').at({width, height})
      .call(drag)
      .st({cursor: 'pointer'})

    if (key == 'threshold_m') svg.classed('no-blink', 1)



    svg.append('rect').at({width, height, fill: lcolors.well})

    var rectSel = svg.append('rect.threshold-rect')
      .at({width, height, fill: lcolors.sick})

    var handleSel = svg.append('g.threshold-handle')
    handleSel.append('text.cursor')
      .text('▲')
      .at({textAnchor: 'middle', fontSize: 10, y: height, dy: '.8em'})
    handleSel.append('circle')
      .at({cy: height, r: 30, fill: 'rgba(0,0,0,0)'})

    var labelText = 'Model Aggressiveness _→'
    var _replacement = !text ? '' : 'On ' + (text == 'f' ? 'Women ' : 'Men ')

    var labelText = '_Model Aggressiveness →'
    var _replacement = !text ? '' : (text == 'f' ? 'Adult ' : 'Adult ')

    var labelText = '_Model Decision Point'
    var _replacement = !text ? '' : (text == 'f' ? 'Adult ' : 'Adult ')

    var labelText = 'Model Decision Point_'
    var _replacement = !text ? '' : (text == 'f' ? ' for Adults ' : ' for Children ')

    var labelText = '_ Model Aggressiveness →'
    var _replacement = !text ? '' : (text == 'f' ? ' Adult ' : 'Child ')


    svg.append('text.axis').text(labelText.replace('_', _replacement))
      .at({y: height/2, dy: '.33em', dx: 10})
      .st({pointerEvents: 'none'})



    function updateThreshold(threshold, skipDom){
      rv[key] = threshold
      data.forEach(d => d.threshold = threshold)

      mini.updateAll()

      rectSel.at({width: x(threshold)})
      handleSel.translate(x(threshold), 0)

      if (skipDom) return

      if (key == 'threshold'){
        allActiveSel.at({width: x(threshold)})
        allHandleSel.translate(x(threshold), 0)
      }

      sel.rectSel.at({fill: d => d.grade > d.threshold ? lcolors.sick : lcolors.well})
      sel.textSel
        .st({
          strokeWidth: d => d.grade > d.threshold == d.isSick ? 0 : .6,
        })

    }

    return updateThreshold
  }

  return rv
}






if (window.init) window.init()
