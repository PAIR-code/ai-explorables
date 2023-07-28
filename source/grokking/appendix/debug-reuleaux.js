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


window.initDebugReuleaux = async function({type, state, sel, title, caption}){
  var isIn = type == 'inProj'
  
  sel = sel.append('div')
  var c = d3.conventions({
    sel: sel.append('div'),
    width:  300,
    height: 300,
    layers: 's',
    margin: {top: 30, bottom: 0},
  })
  sel.append('p.caption').html(caption).st({width: 300})

  c.svg.append('text').text(title)
    .at({y: -5, fontSize: 14, fontWeight: 600})

  c.yAxis.ticks(3)
  c.xAxis.ticks(3)

  var max = 1
  c.svg.selectAll('rect, .axis').remove()
  c.x.domain([-max*1.3, max*1.3])
  c.y.domain([-max*1.3, max*1.3])
  d3.drawAxis(c)
  util.ggPlot(c)
  c.svg.selectAll('.axis text').remove()

  c.xy = ([x, y]) => [c.x(x), c.y(y)]

  c.svg.append('circle')
    .translate(c.xy([0, 0]))
    .at({r: c.x(max*.7)/2, stroke: '#ccc', fill: 'none'})

  state.allOutSumPos.forEach(d => {
    d.isSeg =  1.2 < d.correctAngle && d.correctAngle < 3.1
  })

  c.svg.appendMany('circle', state.allOutSumPos)
    .translate(d => c.xy(d.pos))
    .at({r: 2, fill: d => d.isSeg ? '#f00' : ''})






}
window.initAppendix?.()




// function calcReuleaux(angle) {
//   const R = 1; // radius of each circle
//   var a = Math.PI*2/3; // 60 degrees

//   const centers = [[0, 0], [R, 0], [-R * Math.cos(a), -R * Math.sin(Math.PI / 3)]];
  
//   let point;
  
//   if (angle >= 0 && angle < Math.PI * 2/3) {
//     point = pointOnCircle(angle, R, centers[0]); 
//   } else if (angle >= Math.PI * 2/3 && angle < Math.PI * 4/3) {
//     point = pointOnCircle(angle - Math.PI * 2/3, R, centers[1]);
//   } else {
//     point = pointOnCircle(angle - Math.PI * 4/3, R, centers[2]);
//   }

//   return point;
// }