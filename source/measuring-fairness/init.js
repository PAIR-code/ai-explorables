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




d3.select('body').selectAppend('div.tooltip.tooltip-hidden')

nCols = 12

window.colors = {
  well: d3.color('#669399') + '',
  sick: d3.color('#EE2A2A') + '',

  // well: d3.color('green') + '',
  // sick: d3.color('purple'),

  // well: d3.color('#e9a3c9') + '',
  // sick: d3.color('#a1d76a'),

  // well: d3.color('#e9a3c9') + '',
  // sick: d3.color('#a1d76a'),

  // well: d3.color('#e9a3c9') + '',
  // sick: d3.color('#a1d76a'),

  // well: d3.color('#865327') + '',
  // sick: d3.color('#012394'),

  // well: d3.color('#012394') + '',
  // sick: d3.color('#FBC20F') + '',

  // well: d3.color('#012394') + '',
  // sick: d3.color('#E71E24') + '',

  // well: d3.color('#A9159C') + '',
  // sick: d3.color('#E71E24') + '',

  // well: d3.color('#A9159C') + '',
  // sick: d3.color('#012394') + '',

  // well: d3.color('orange') + '',
  // sick: d3.color('#012394') + '',


}

window.colors = {
  well: d3.interpolate(colors.well, '#fff')(.5),
  sick: d3.interpolate(colors.sick, '#fff')(.2),
}

window.lcolors = {
  well: d3.interpolate(colors.well, '#fff')(.5),
  sick: d3.interpolate(colors.sick, '#fff')(.35)
}
window.llcolors = {
  well: d3.interpolate(colors.well, '#fff')(.5),
  sick: d3.interpolate(colors.sick, '#fff')(1)
}
window.dcolors = {
  well: d3.interpolate(colors.well, '#000')(.65),
  sick: d3.interpolate(colors.sick, '#000')(.65)
}

// window.colors = {
//   well: d3.color('#BEF5FF') + '',
//   sick: d3.color('#FCC5C3') + '',
// }

// window.colors = {
//   well: d3.color('#669399') + '',
//   sick: d3.color('#EE2A2A') + '',
// }

// window.lcolors = {
//   well: d3.interpolate(colors.well, '#fff')(.3),
//   sick: d3.interpolate(colors.sick, '#fff')(.3)
// }
// window.llcolors = {
//   well: d3.interpolate(colors.well, '#fff')(.2),
//   sick: d3.interpolate(colors.sick, '#fff')(.2)
// }

// window.lcolors = {
//   well: '#CFFCF6',
//   sick: '#FFBD96'
// }

// copy(logColors())
function logColors(){
  return `
    body{
      --colors-well: ${d3.rgb(colors.well)};
      --colors-sick: ${d3.rgb(colors.sick)};
      --lcolors-well: ${d3.rgb(lcolors.well)};
      --lcolors-sick: ${d3.rgb(lcolors.sick)};
      --dcolors-well: ${d3.rgb(dcolors.well)};
      --dcolors-sick: ${d3.rgb(dcolors.sick)};
    }
  `
}



window.init = function(){
  console.clear()

  graphSel = d3.select('#graph').html('').append('div')
  totalWidth = graphSel.node().offsetWidth
  totalWidth = 400

  c = d3.conventions({
    sel: graphSel.st({marginTop: 40}),
    margin: {top: 20},
    totalWidth,
    totalHeight: totalWidth,
  })

  students = makeStudents()
  sel = makeSel()
  mini = makeMini()
  slider = makeSlider()
  slides = makeSlides()
  gs = makeGS()

  function sizeGraphSel(){
    var scale = (totalWidth + 35)/(innerWidth - 10) // off by one, s is 35
    scale = d3.clamp(1, scale, 2)

    graphSel.st({
      transform: `scale(${1/scale})`,
      transformOrigin: '0px 0px',

    })
  }
  sizeGraphSel()
  d3.select(window).on('resize', sizeGraphSel)

}
init()





!(function(){
  var footnums = '¹²³'

  d3.selectAll('.footstart').each(function(d, i){
    d3.select(this)
      .at({
        href: '#footend-' + i,
      })
      .text(footnums[i])
      .parent().at({id: 'footstart-' + i})
  })

  d3.selectAll('.footend').each(function(d, i){
    d3.select(this)
      .at({
        href: '#footstart-' + i,
        id: 'footend-' + i,
      })
      .text(footnums[i])
  })


  d3.selectAll('#sections wee, #graph .weepeople').attr('aria-hidden', true)

})()

















