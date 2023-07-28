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



window.circleFreqInit = () => {
  var r = 100

  var state = window.state = {
    p: 113,
    a: 110,
    b: 50,
    k: 1,
  }

  var sel = d3.select('.circle-diagram').html('')

  function renderAll(){ 
    renderAll.fns.forEach(d => d())
  }
  renderAll.fns = []


  drawSliders(sel)
  drawProjectionCircle(sel)
  renderAll()





  function drawProjectionCircle(sel){
    var c = d3.conventions({
      sel: sel.append('div'),
      width: 300,
      height: 300,
    })

    c.svg.append('rect')
      .at({width: c.width, height: c.height, fill: '#eee'})


    var centerSel = c.svg.append('g')
      .translate([c.width/2, c.height/2])

    centerSel.append('circle')
      .at({r, stroke: '#999', fill: 'none'})

    var maxR = c.width/2
    centerSel.append('path')
      .at({d: ['M', maxR, 0, 'H', -maxR].join(' '), stroke: '#ccc'})
    centerSel.append('path')
      .at({d: ['M', 0, maxR, 'V', -maxR].join(' '), stroke: '#ccc'})


    var aCircleSel = centerSel.append('circle')
      .at({r: 5, stroke: 'steelblue', fill: 'none', strokeWidth: 2})

    var bCircleSel = centerSel.append('circle')
      .at({r: 5, stroke: 'orange', fill: 'none', strokeWidth: 2})

    var aLineSel = centerSel.append('path').at({stroke: 'steelblue', fill: 'none'})
    var bLineSel = centerSel.append('path').at({stroke: 'orange', fill: 'none'})

    var aPoints = d3.range(0, 1 + .001, .001).map(v => ({v, x: 0, y: 0}))
    var bPoints = d3.range(0, 1 + .001, .001).map(v => ({v, x: 0, y: 0}))


    var line = d3.line().x(d => d.x).y(d => d.y)
      .curve(d3.curveCatmullRomOpen)

    renderAll.fns.push(() => {
      var {p, a, b, k} = state
      var ωk = Math.PI*2*k/p

      function calcPos(x){
        var spiralSpacing = .5 // the space between successive turns of the spiral
        var rs = spiralSpacing * Math.exp(ωk*x)

        var rs = spiralSpacing * x * Math.sqrt(ωk) + r

        return [Math.cos(ωk*x)*rs, - Math.sin(ωk*x)*rs]
      }

      aCircleSel.translate(calcPos(a))
      bCircleSel.translate(calcPos(a + b))

      aPoints.forEach(d => { var [x, y] = calcPos(d.v*a); d.x = x; d.y = y; }) 
      bPoints.forEach(d => { var [x, y] = calcPos(a + d.v*b); d.x = x; d.y = y}) 

      aLineSel.at({d: line(aPoints)})
      bLineSel.at({d: line(bPoints)})
    })
  }



  function drawSliders(sel){
    sel = sel.append('div.sliders')

    var sliders = ['a', 'b', 'k'].map(key => ({
      sel: sel.append('div.slider'),
      key,
      getVal: _ => state[key],
      setVal: d => state[key] = +d
    }))

    sliders.forEach(slider => {

      slider.sel.html(`
        <div>
          ${slider.key} <val></val>
        </div>
        <div>
          <input type=range min=${slider.key == 'k' ? 1 : 0} max=${state.p - 1} step=1 value=${slider.getVal()}></input>
        </div>
      `)
      slider.sel.select('input[type="range"]')
        .on('input', function () {
          slider.setVal(this.value)
          renderSlider()
          renderAll()
        })

      function renderSlider(){ slider.sel.select('val').text(slider.getVal()) }
      renderSlider()
    })
  }

}
circleFreqInit()
