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





var sliderVals = {}

var sliders = [
  {
    key: 'fNoiseMag',
    text: 'Feature Noise',
    r: [0, 1],
    v: .5
  },
  {
    key: 'fBiasMag',
    text: 'Feature Bias',
    r: [0, 1],
    v: .2
  },
]

!(function(){
  var width = 145
  var height = 30

  sliders.forEach(d => {
    d.s = d3.scaleLinear().domain(d.r).range([0, width])
    sliderVals[d.key] = d
  })

  var sliderSel = d3.select('.slider').html('')
    .appendMany('div', sliders)
    .at({class: d => d.key})
    .st({
      display: 'inline-block',
      width: width,
      paddingRight: 60,
      marginTop: 20,
      color: '#000'
    })

  sliderSel.append('div')
    .text(d => d.text)
    .st({marginBottom: height/2})

  var svgSel = sliderSel.append('svg').at({width, height})
    .on('click', function(d){
      d.v = d.s.invert(d3.mouse(this)[0])
      updatePos()
    })
    .st({
      cursor: 'pointer'
    })
    .append('g').translate(height/2, 1)
  svgSel.append('rect').at({width, height, y: -height/2, fill: '#fff'})

  svgSel.append('path').at({
    d: `M 0 0 H ${width}`, 
    stroke: '#000',
    strokeWidth: 2
  })

  var drag = d3.drag()
    .on('drag', function(d){
      var x = d3.mouse(this)[0]
      d.v = d3.clamp(d3.min(d.r), d.s.invert(x), d3.max(d.r))

      updatePos()
    })

  var circleSel = svgSel.append('circle')
    .at({
      r: height/2,
      stroke: '#000', 
      strokeWidth: 2,
      fill: '#fff',
    })
    .call(drag)


  function updatePos(){
    circleSel.at({cx: d => d.s(d.v)})
    if (sliderVals.onUpdate) sliderVals.onUpdate()
  }

  updatePos()
  sliderVals.updatePos = updatePos
})()
