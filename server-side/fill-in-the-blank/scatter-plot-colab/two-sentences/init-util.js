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


window.initUtil = function(){
  function palette(min, max){
    // https://blocks.roadtolarissa.com/1wheel/raw/94091c1f8a69d5966e48aef4ac19baf9/index.html?colors=00006e-006a78-00a963-8a8a8a-d5882a-a15142-7f0000&numTicks=255&space=lab&type=basis
    var colors = ['#00006e', '#00006e', '#00006f', '#00006f', '#00006f', '#000070', '#000070', '#000170', '#000471', '#000871', '#000b71', '#000f72', '#001272', '#001572', '#001872', '#001b73', '#001e73', '#002173', '#002473', '#002674', '#002974', '#002c74', '#002e74', '#003174', '#003375', '#003675', '#003975', '#003b75', '#003e75', '#004075', '#004375', '#004575', '#004775', '#004a75', '#004c75', '#004f75', '#005175', '#005375', '#005675', '#005875', '#005a75', '#005c75', '#005e75', '#006175', '#006375', '#006574', '#006774', '#006974', '#006b74', '#006d74', '#006f73', '#007173', '#007373', '#007473', '#007672', '#007872', '#007a72', '#007b72', '#007d71', '#007f71', '#008071', '#008270', '#008370', '#008570', '#008670', '#00886f', '#00896f', '#008a6f', '#008c6f', '#008d6e', '#008e6e', '#008f6e', '#00906e', '#00916e', '#00926d', '#00936d', '#00946d', '#00956d', '#00966d', '#00976d', '#00976d', '#00986d', '#00996d', '#00996d', '#009a6d', '#009a6e', '#009b6e', '#009b6e', '#009b6e', '#079c6f', '#119c6f', '#189c6f', '#1e9c70', '#249c70', '#289c70', '#2d9c71', '#319c71', '#359c71', '#399c72', '#3c9c72', '#409c73', '#439c73', '#479b74', '#4a9b74', '#4d9b74', '#509b75', '#539a75', '#569a76', '#599976', '#5c9976', '#5f9976', '#629877', '#659877', '#679777', '#6a9777', '#6d9677', '#6f9678', '#729578', '#749578', '#779478', '#799477', '#7c9377', '#7e9377', '#819277', '#839277', '#859176', '#889176', '#8a9175', '#8c9075', '#8e9074', '#908f73', '#938f73', '#958e72', '#978e71', '#998e70', '#9b8d6f', '#9d8d6e', '#9f8d6d', '#a08c6c', '#a28c6b', '#a48c69', '#a68b68', '#a88b67', '#a98b65', '#ab8a64', '#ac8a63', '#ae8a61', '#af8960', '#b1895f', '#b2895d', '#b4885c', '#b5885a', '#b68859', '#b78757', '#b88756', '#b98755', '#ba8653', '#bb8652', '#bc8550', '#bd854f', '#be854d', '#bf844c', '#bf844b', '#c0834a', '#c08348', '#c18247', '#c18246', '#c28145', '#c28044', '#c28043', '#c27f42', '#c27e41', '#c37e40', '#c27d3f', '#c27c3f', '#c27b3e', '#c27a3d', '#c27a3d', '#c1793c', '#c1783c', '#c1773c', '#c0763b', '#c0753b', '#bf743a', '#bf733a', '#be713a', '#bd703a', '#bd6f39', '#bc6e39', '#bb6d39', '#bb6b38', '#ba6a38', '#b96938', '#b86737', '#b76637', '#b76537', '#b66336', '#b56236', '#b46035', '#b35e35', '#b25d34', '#b15b34', '#b05933', '#af5833', '#ae5632', '#ad5431', '#ad5230', '#ac502f', '#ab4e2f', '#aa4c2e', '#a94a2c', '#a8482b', '#a7462a', '#a64429', '#a54127', '#a43f26', '#a33d24', '#a33a23', '#a23721', '#a1351f', '#a0321e', '#9f2f1c', '#9e2c1a', '#9d2818', '#9c2516', '#9c2114', '#9b1d11', '#9a180f', '#99120d', '#980b0a', '#970207', '#960004', '#950001', '#940000', '#930000', '#920000', '#910000', '#900000', '#8f0000', '#8e0000', '#8e0000', '#8d0000', '#8c0000', '#8b0000', '#8a0000', '#890000', '#880000', '#870000', '#860000', '#850000', '#840000', '#830000', '#820000', '#810000', '#800000']

      return v => {
        var i = d3.clamp(0, (v - min)/(max - min), 1)
        return colors[Math.round(i*(colors.length - 1))]
      }
  }
  
  var util = {
    palette,
    color: d3.interpolateSpectral,
    color: palette(0, 1),
  }
  
  util.colors = [1 - .25, .25].map(util.color)

  util.updateSentenceLabels = pair => {
    var t0 = tokenizer.tokenize(pair.s0)
    var t1 = tokenizer.tokenize(pair.s1)

    var i = 0
    while (t0[i] == t1[i] && i < t0.length) i++

    var j = 1
    while (t0[t0.length - j] == t1[t1.length - j] && j < t0.length) j++

    pair.label0 = tokens2origStr(t0, pair.s0)
    pair.label1 = tokens2origStr(t1, pair.s1)

    function tokens2origStr(t, s){
      var tokenStr = tokenizer.decode(t.slice(i, -j + 1)).trim()
      var lowerStr = s.toLowerCase()

      var startI = lowerStr.indexOf(tokenStr)
      return s.slice(startI, startI + tokenStr.length)
    }

    if (
      !pair.label0.length || 
      !pair.label1.length || 
      pair.label0.length > 15 || 
      pair.label1.length > 15){
      pair.label0 = ''
      pair.label1 = ''
    }

    // console.log(i, j, pair.label0, pair.label1)
  }

  util.addAxisLabel = (c, xText, yText, xOffset=37, yOffset=-35) => {
    c.svg.select('.x').append('g')
      .translate([c.width/2, xOffset])
      .append('text.axis-label')
      .text(xText)
      .at({textAnchor: 'middle'})
      .st({fill: '#000'})

    c.svg.select('.y')
      .append('g')
      .translate([yOffset, c.height/2])
      .append('text.axis-label')
      .text(yText)
      .at({textAnchor: 'middle', transform: 'rotate(-90)'})
      .st({fill: '#000'})
  }

  util.ggPlotBg = (c) => {
    c.svg.append('rect')
      .at({width: c.width, height: c.height, fill: '#eee'})
      .lower()

    c.svg.selectAll('.tick').selectAll('line').remove()
    c.svg.selectAll('.y .tick')
      .append('path').at({d: 'M 0 0 H ' + c.width, stroke: '#fff', strokeWidth: 1})
    c.svg.selectAll('.y text').at({x: -3})
    c.svg.selectAll('.x .tick')
      .append('path').at({d: 'M 0 0 V -' + c.height, stroke: '#fff', strokeWidth: 1})
  }

  util.corrFmt = d => (d3.format('+.2f')(d)).replace('0.', '.')

  return util
}

if (window.init) window.init()

