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


window.makeSel = function(){
  var s = c.width/(nCols -2) -1

  var personSel = c.svg.appendMany('g', students)
  var rectSel = personSel.append('rect')
    .at({
      height: s,
      width: s,
      x: -s/2,
      y: -s/2,
      // fillOpacity: .2
    })

  var textSel = personSel.append('text.weepeople')
    .text(d => d.letter)
    .at({fontSize: d => d.isMale ? 26 : 34, dy: '.33em', textAnchor: 'middle'})
    .st({stroke: d => d.isSick ? dcolors.sick : dcolors.well})

  addSwoop(c)

  var botAxis = c.svg.append('g').translate(c.width + 150, 1)
  var truthAxis = botAxis.append('g.axis').translate([0, 0])

  truthAxis.append('text').text('Truth')
    .at({textAnchor: 'middle', fontWeight: 500, x: s*2.65})

  truthAxis.append('g').translate([45, 22])
    .append('text').text('Sick').parent()
    .append('text.weepeople').text('k')
      .at({fontSize: 34, x: 22, y: 5})
      .st({fill: colors.sick})

  truthAxis.append('g').translate([95, 22])
    .append('text').text('Well').parent()
    .append('text.weepeople').text('d')
      .at({fontSize: 34, fill: colors.well, x: 22, y: 5})
      .st({fill: colors.well})


  var mlAxis = botAxis.append('g.axis').translate([220, 0])

  mlAxis.append('text').text('ML Prediction')
    .at({textAnchor: 'middle', fontWeight: 500, x: s*2.8})

  mlAxis.append('g').translate([35, 22])
    .append('text').text('Sick').parent()
    .append('rect')
      .at({width: s*.7, height: s*.7, fill: lcolors.sick, x: 28, y: -17})

  mlAxis.append('g').translate([100, 22])
    .append('text').text('Well').parent()
    .append('rect')
      .at({width: s*.7, height: s*.7, fill: lcolors.well, x: 28, y: -17})



  var fpAxis = c.svg.append('g.axis')

  // fpAxis.append('rect')
  //   .translate(nCols*s - 20, 1)
  //   .at({
  //     fill: lcolors.well,
  //     x: -82,
  //     y: -12,
  //     width: 56,
  //     height: 28,
  //     // stroke: '#000',
  //   })

  // fpAxis.append('text')
  //   .translate(nCols*s - 20, 1)
  //   .tspans(['False', 'Negatives'], 12)
  //   .at({textAnchor: 'end', x: -s/2 - 10, fill: colors.sick})


  // fpAxis.append('text')
  //   .translate(nCols*s, 0)
  //   .tspans(['False', 'Positives'], 12)
  //   .at({textAnchor: 'start', x: s/2 + 7, fill: colors.well})


  var sexAxis = c.svg.append('g.axis')
 
  sexAxis.append('text').st({fontWeight: 500, fill: ''})
    .translate([-15, -30])
    .text('Adults')

  sexAxis.append('text').st({fontWeight: 500, fill: ''})
    .translate([-15, -30 + students.maleOffsetPx])
    .text('Children')


  var brAxis = c.svg.append('g.axis')
  var cpx = 0

  brAxis.append('path')
    .translate([-15, -20])
    .at({
      stroke: colors.sick,
      fill: 'none',
      d: ['M -3 -3 v', -cpx, 'h', students.fSickCols*students.colWidth, 'v', cpx].join('')
    })

  brAxis.append('path')
    .translate([-15, -20  + students.maleOffsetPx])
    .at({
      stroke: colors.sick,
      fill: 'none',
      d: ['M -3 -3 v', -cpx, 'h', students.mSickCols*students.colWidth, 'v', cpx].join('')
    })

  brAxis.append('text').st({fontWeight: 500, fill: colors.sick})
    .translate([-15, -30])
    .text('Sick Adults')

  brAxis.append('text').st({fontWeight: 500, fill: colors.sick})
    .translate([-15, -30 + students.maleOffsetPx])
    .text('Sick Children')




  return {personSel, textSel, rectSel, fpAxis, sexAxis, brAxis, truthAxis, mlAxis, botAxis}
}










if (window.init) window.init()
