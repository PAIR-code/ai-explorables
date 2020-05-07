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





window.makeMini = function(){

  var s = 10
  var sScale = ([a, b]) => [s*a, s*b]

  var miniSel = d3.selectAll('.mini').html('').each(addMini).st({overflow: 'visible'})

  var cColors = {
    true:  {true: colors.sick, false: lcolors.sick},
    false: {true: colors.well, false: lcolors.well}
  }
  var rColors = {
    true:  {true: lcolors.sick, false: llcolors.sick},
    false: {true: lcolors.well, false: llcolors.well}
  }


  function addMini(){
    var miniSel = d3.select(this)

    var type = miniSel.attr('type')
    var sex = miniSel.attr('sex')
    var isAll = sex == 'all'

    miniSel.st({marginBottom: sex == 'male' ? 30 : 0})

    var data = students
      .filter(d => isAll ? true : sex == 'male' ? d.isMale : !d.isMale)

    var topDatum = {}
    var botDatum = {}

    if (type == 'fp'){
      topDatum.opacity = d => d.grade > d.threshold && d.isSick
      botDatum.opacity = d => d.isSick
    } else {
      topDatum.opacity = d => d.grade > d.threshold && d.isSick
      botDatum.opacity = d => d.grade > d.threshold
    }



    var top = -s*nCols/2 + 10
    if (!isAll) top /= 2
    addGrid(miniSel.append('span'), topDatum)
    miniSel.append('span.equation').text('÷').st({top, fontWeight: '', fontSize: 20})
    addGrid(miniSel.append('span'), botDatum)
    miniSel.append('span.equation').text('=').st({top, fontWeight: '', fontSize: 20})

    if (!isAll){
      var sexStr = sex == 'male' ? 'children' : 'adults'

      var coStr = `of ${sexStr} <br>testing positive<br>are sick`
      var fpStr = `of ${sexStr} <br>who are sick <br>test positive`
      miniSel.st({position: 'relative'})
        .append('div.axis')
        .st({position: 'absolute', right: -9, textAlign: 'center', width: 95, lineHeight: 14, bottom: -15})
        .html(type == 'fp' ? fpStr : coStr)

    }
    
    var percentSel = miniSel.append('span.equation').st({top, marginLeft: 0})

    function update(){
      topDatum.update()
      botDatum.update()

      var percent = d3.sum(data, topDatum.opacity)/d3.sum(data, botDatum.opacity)
      percentSel.text(d3.format('.0%')(percent))
    }

    miniSel.datum({update}) 


    function addGrid(gridSel, datum){
      var {opacity} = datum

      var width = s*nCols
      var height = s*nCols*(isAll ? 1 : .5)
      var svg = gridSel.append('svg').at({width, height})

      var callSickSel = svg.append('rect')
        .at({width, height, fill: lcolors.sick})

      var callWellPath = svg.append('path')
        .at({width, height, fill: lcolors.well})


      var personSel = svg.appendMany('g', data)
        .translate(d => sScale(d.pos[isAll ? 'allIJ' : 'sexGroupIJ']))

      var pad = 0
      // var rectSel = personSel.append('rect')
      //   .at({
      //     height: s - pad,
      //     width: s - pad,
      //     // stroke: '#666',
      //     // strokeWidth: .1,
      //   })


      var circleSel = personSel.append('circle')
        .at({r: s/4, cx: s/2 - pad/2, cy: s/2 - pad/2, fill: d => d.isSick ? colors.sick : '#777'})

      if (!isAll){
        svg.append('path')
          .translate([-1, -5])
          .at({stroke: colors.sick, d: 'M 0 0 H ' + (sex == 'male' ? 8 : 4)*s})
      }

      var geodata = {type: 'FeatureCollection'}
      geodata.features = data.map(d => {
        var [x, y] = sScale(d.pos[isAll ? 'allIJ' : 'sexGroupIJ'])
        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [[x, y], [x, y + s], [x + s, y + s], [x + s, y], [x, y]]
            ]
          },
          properties: {d},
        }
      })

      var topology = topojson.topology({boxes: geodata})
      var geowrap = topojson.feature(topology, topology.objects.boxes)
      var path = d3.geoPath()

      var hiddenPath = svg.append('path')
        .at({stroke: 'none', fill: 'rgba(255,255,255,.6)'})
        .translate(.5, 1)

      var includedPath = svg.append('path')
        .at({stroke: '#000', fill: 'none'})
        .translate(.5, 1)


      circleSel.at({fill: d => d.isSick ? colors.sick : colors.well})

      datum.update = () => {
        // rectSel.at({
        //   // fill: d => rColors[d.grade > d.threshold][opacity(d)],
        //   // strokeWidth: d => opacity(d) ? 1 : .1,
        // })

        // circleSel.at({fill: d => cColors[d.isSick][opacity(d)]})

        var byType = d3.nestBy(topology.objects.boxes.geometries, d => opacity(d.properties.d))

        byType.forEach(type => {
          var obj = {type: 'GeometryCollection', geometries: type}
          var pathStr = path(topojson.mesh(topology, obj, (a, b) => a == b))

          var pathSel = type.key == 'true' ? includedPath : hiddenPath
          pathSel.at({d: pathStr})
        })

        var sickBoxes = topology.objects.boxes.geometries
          .filter(d => d.properties.d.grade <= d.properties.d.threshold)
        var obj = {type: 'GeometryCollection', geometries: sickBoxes}
        var pathStr = path(topojson.mesh(topology, obj, (a, b) => a == b))
        callWellPath.at({d: pathStr})
      }
    }
   
  }



  function updateAll(){
    miniSel.each(d => d.update())
  }

  return {updateAll}
}









if (window.init) window.init()
