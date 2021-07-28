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

window.ttSel = d3.select('body').selectAppend('div.tooltip.tooltip-hidden')

window.palette = function palette(min, max){
  // https://blocks.roadtolarissa.com/1wheel/raw/94091c1f8a69d5966e48aef4ac19baf9/index.html?colors=00006e-006a78-00a963-8a8a8a-d5882a-a15142-7f0000&numTicks=255&space=lab&type=basis
  var colors = ['#00006e', '#00006e', '#00006f', '#00006f', '#00006f', '#000070', '#000070', '#000170', '#000471', '#000871', '#000b71', '#000f72', '#001272', '#001572', '#001872', '#001b73', '#001e73', '#002173', '#002473', '#002674', '#002974', '#002c74', '#002e74', '#003174', '#003375', '#003675', '#003975', '#003b75', '#003e75', '#004075', '#004375', '#004575', '#004775', '#004a75', '#004c75', '#004f75', '#005175', '#005375', '#005675', '#005875', '#005a75', '#005c75', '#005e75', '#006175', '#006375', '#006574', '#006774', '#006974', '#006b74', '#006d74', '#006f73', '#007173', '#007373', '#007473', '#007672', '#007872', '#007a72', '#007b72', '#007d71', '#007f71', '#008071', '#008270', '#008370', '#008570', '#008670', '#00886f', '#00896f', '#008a6f', '#008c6f', '#008d6e', '#008e6e', '#008f6e', '#00906e', '#00916e', '#00926d', '#00936d', '#00946d', '#00956d', '#00966d', '#00976d', '#00976d', '#00986d', '#00996d', '#00996d', '#009a6d', '#009a6e', '#009b6e', '#009b6e', '#009b6e', '#079c6f', '#119c6f', '#189c6f', '#1e9c70', '#249c70', '#289c70', '#2d9c71', '#319c71', '#359c71', '#399c72', '#3c9c72', '#409c73', '#439c73', '#479b74', '#4a9b74', '#4d9b74', '#509b75', '#539a75', '#569a76', '#599976', '#5c9976', '#5f9976', '#629877', '#659877', '#679777', '#6a9777', '#6d9677', '#6f9678', '#729578', '#749578', '#779478', '#799477', '#7c9377', '#7e9377', '#819277', '#839277', '#859176', '#889176', '#8a9175', '#8c9075', '#8e9074', '#908f73', '#938f73', '#958e72', '#978e71', '#998e70', '#9b8d6f', '#9d8d6e', '#9f8d6d', '#a08c6c', '#a28c6b', '#a48c69', '#a68b68', '#a88b67', '#a98b65', '#ab8a64', '#ac8a63', '#ae8a61', '#af8960', '#b1895f', '#b2895d', '#b4885c', '#b5885a', '#b68859', '#b78757', '#b88756', '#b98755', '#ba8653', '#bb8652', '#bc8550', '#bd854f', '#be854d', '#bf844c', '#bf844b', '#c0834a', '#c08348', '#c18247', '#c18246', '#c28145', '#c28044', '#c28043', '#c27f42', '#c27e41', '#c37e40', '#c27d3f', '#c27c3f', '#c27b3e', '#c27a3d', '#c27a3d', '#c1793c', '#c1783c', '#c1773c', '#c0763b', '#c0753b', '#bf743a', '#bf733a', '#be713a', '#bd703a', '#bd6f39', '#bc6e39', '#bb6d39', '#bb6b38', '#ba6a38', '#b96938', '#b86737', '#b76637', '#b76537', '#b66336', '#b56236', '#b46035', '#b35e35', '#b25d34', '#b15b34', '#b05933', '#af5833', '#ae5632', '#ad5431', '#ad5230', '#ac502f', '#ab4e2f', '#aa4c2e', '#a94a2c', '#a8482b', '#a7462a', '#a64429', '#a54127', '#a43f26', '#a33d24', '#a33a23', '#a23721', '#a1351f', '#a0321e', '#9f2f1c', '#9e2c1a', '#9d2818', '#9c2516', '#9c2114', '#9b1d11', '#9a180f', '#99120d', '#980b0a', '#970207', '#960004', '#950001', '#940000', '#930000', '#920000', '#910000', '#900000', '#8f0000', '#8e0000', '#8e0000', '#8d0000', '#8c0000', '#8b0000', '#8a0000', '#890000', '#880000', '#870000', '#860000', '#850000', '#840000', '#830000', '#820000', '#810000', '#800000']

    return v => {
      var i = d3.clamp(0, (v - min)/(max - min), 1)
      return colors[Math.round(i*(colors.length - 1))]
    }

    // https://gka.github.io/palettes/#/99|d|00429d,96ffea,d1ea00|d1ea00,ff005e,93003a|1|1
    // https://gka.github.io/palettes/#/99|d|00429d,96ffea,f1f1d2|f1f1d2,ff005e,93003a|1|1
    //https://gka.github.io/palettes/#/99|d|00429d,76dfca,d1d1b3|d1d1b3,a787a8,93003a|1|1
    // https://gka.github.io/palettes/#/99|d|76dfca,00429d,000000|000000,93003a,ff005e|1|1

    // https://gka.github.io/palettes/#/99|d|078977,91a5ff,555555|555555,e2bfe3,980000|0|1
    // https://gka.github.io/palettes/#/99|d|002854,a1ffe1,555555|555555,ffa361,980000|0|1
    // https://gka.github.io/palettes/#/99|d|002854,a1ffe1,616161|616161,f47e2a,9e005c|0|1
    // var nMid = 13
    // var midIndex = Math.floor(colors.length/2)
    // var minIndex = midIndex - (nMid - 1)/2
    // var maxIndex = midIndex + (nMid - 1)/2
    // var interpolate = d3.interpolate(colors[minIndex], colors[maxIndex])

    // d3.range(minIndex, maxIndex + 1).forEach(i => {
    //   colors[i] = interpolate((i - minIndex)/nMid)
    // })

  // return d => {
  //   var rv = d3.interpolateGreys(d/2 + 2/2)
  //   if (rv == 'rgb(255, 255, 255)') rv = 'rgb(254, 254, 254)'
  //   return rv
  // }

}
window.util = {
  palette,
  color: d3.interpolateSpectral,
  color: palette(0, 1),
}
window.util.colors = [1 - .25, .25].map(util.color)
window.util.colors.push('#aaaa00')

!(function(){
  var memo = {}

  util.color2array = d => {
    if (memo[d]) return memo[d]

    var {r, g, b} = d3.color(d).rgb()
    return memo[d] = [r, g, b].map(v => v/255)
  }
})()


// add colors to inline elements
!(function(){
  d3.selectAll('c0').st({fontWeight: 600, color: util.colors[0]})
  d3.selectAll('c1').st({fontWeight: 600, color: util.colors[1]})
  d3.selectAll('c2').st({fontWeight: 600, color: util.colors[2]})
})()



window.pairs = [
  {
    class: 'texas-ohio',
    s0: 'In New York, they like to buy _.',
    s1: 'In Texas, they like to buy _.',
    count: 30,
    annotations: [
      {
        str: 'BERT associates these potential purchases <b>more with Texas</b><br> than New York...',
        pos: [15, 15],
        color: util.colors[1]
      },
      {
        str: '...and these purchases <br><b>more with New York</b><br> than Texas',
        pos: [290, 305],
        color: util.colors[0]
      },
    ],
    ariaLabel: 'Scatter plot of differences in purchases between New York and Texas. Oil, cotten and land are associated more with Texas; Pictures and perfume are more associated with New York',
    alts: [
      {
        str: 'Ireland v. Australia',
        s1: 'We went to Ireland and bought a _.',
        s0: 'We went to Australia and bought a _.',
      },
      {
        str: 'Arctic v. Equator',
        s1: 'Near the Arctic, they like to buy  _.',
        s0: 'Near the equator, they like to buy  _.',
      },
      {
        str: 'Coast v. Plains',
        s1: 'On the coast, they like to buy _.',
        s0: 'On the plains, they like to buy _.',
      },
      {
        str: 'Narnia v. Gotham',
        s1: 'In Narnia, they bought a _.',
        s0: 'In Gotham, they bought a _.',
      },
      {
        str: 'Supermarket v. Mall',
        s1: 'At the supermarket, they like to buy _.',
        s0: 'At the mall, they like to buy _.',
      },
      // {
      //   str: 'Train v. Plane',
      //   s1: 'At the airport, they like to buy _.',
      //   s0: 'At the bus depot, they like to buy _.',
      // },
      // {
      //   str: 'buy v. sell',
      //   s0: 'They like to buy _.',
      //   s1: 'We like to buy _.',
      // },
            // {
      //   str: 'Paris v. London',
      //   s1: 'In Paris, they like to buy _.',
      //   s0: 'In London, they like to buy _.',
      // },
    ]
    // type: 'Differences',
  },
  {
    class: 'age-name',
    s0: 'Elsie was born in the year of _.',
    s1: 'Lauren was born in the year of _.',
    count: 200,
    ariaLabel: 'Scatter plot of differences in birth years between Elsie and Lauren.',
  },
  {
    class: 'jim-jane',
    s0: 'Jim worked as a _.',
    s1: 'Jane worked as a _.',
    count: 30,
    ariaLabel: 'Scatter plot of differences in occupations between Jim and Jane. Salesmen, carpenter and mechanic are more associated with Jim; Nurse, secretary and modal are more associated with Jane.',
  },
  {
    class: 'nurse-name',
    s0: 'The new nurse was named _.',
    s1: 'The new doctor was named _.',
    count: 30,
    ariaLabel: 'Scatter plot of differences in doctor and nurse names. David, Michael and himself are more associated with doctors; Jean, Sarah and Catherine are more associated with nurses.',

  },  
  {
    class: 'nurse-name-zari-cda',
    s0: 'The new nurse was named _.',
    s1: 'The new doctor was named _.',
    s0: 'The doctor performed CPR even though _ knew it was too late.',
    s1: 'The nurse performed CPR even though _ knew it was too late.',
    s0model: '_zari_cda',
    s1model: '_zari_cda',
    showModel: true,
    count: 30,
    ariaLabel: 'Scatter plot of differences in doctor and nurse names in the Zari model. He and she are equally associated with both. But Jack, Logan and Andrew are more associated with doctors; Emily, Rachel and Amy are more associated with nurses.',
  },
  {
    class: 'interesting-pair',
    s1: '_ flavored ice cream is tasty.',
    s0: '_ flavored ice cream is revolting.',
    count: 30,
    alts: [
      {
        str: 'Dangerous animals',
        s1: '_ is a [friendly|dangerous] animal',
        s0: '_ is a [friendly|dangerous] animal',
      },
    ]
  }
]

pairs.forEach(d => {
  d.count = d.count || 200
  d.s0model = d.s0model || ''
  d.s1model = d.s1model || ''
  d.annotations = d.annotations || []
  d.model = d.s0model ? 'Zari' : 'BERT'
  d.type = d.type || 'Likelihoods'
  d.pairStr = JSON.stringify(d)
})
// pairs = [window.pairs[1]]


var diffs = [
  {
    s0: 'In [Texas|Paris], [Men|Women] like to buy _.',
    s0: 'Born in [1940|2018], [his|her] name was _.',
    s0: 'In [1908|2018], [he|she] was employed as a _.',
    class: 'difference-difference',
    count: 1000,
    annotations: [],
    model: 'BERT',
    type: 'Likelihoods',
    ariaLabel: 'Small multiple difference in difference plots.',
  }
]

diffs.forEach(d => {
  d.pairStr = JSON.stringify(d)
})


window.sents = [
  {
    class: 'hamlet',
    str: 'To be or not to be, that is the question;',
  },
]
sents.push({class: 'texas', str: pairs[0].s1.replace('_', 'things')})
sents.push({class: 'new-york', str: pairs[0].s0.replace('_', 'things')})


window.init = async function(){
  try { window.regltick.cancel() } catch (e) {}

  if (!window.tokenizer){
    window.tokenizer = new BertTokenizer()
    await tokenizer.load()
  }

  if (!window.bertLargeVocab){
    var text = await (await fetch('data/bert_large_vocab.txt')).text()
    window.bertLargeVocab = text
      .split('\n')
  }

  sents.forEach(initSent)
  sleep(10)

  pairs.forEach(initPair)
  sleep(500)
  window.initGenderOverTime()


  // Skip rendering differene in difference until scrolled into view
  var renderDiffDiff = false
    var observer = new IntersectionObserver(entries => {
    entries.forEach(d => {
      if (renderDiffDiff || !d.isIntersecting) return
      
      initDiff(diffs[0])
      renderDiffDiff = true
    })
  }, {})
  observer.observe(d3.select('.difference-difference').node())
  if (renderDiffDiff) initDiff(diffs[0])


  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Run init, rerun when width changes
!(function(){
  var lastInnerWidth = null
  
  function resize(){
    if (lastInnerWidth == window.innerWidth) return
    lastInnerWidth = window.innerWidth

    window.init()
  }
  resize()
  d3.select(window).on('resize', _.debounce(resize, 500))
})()

// Hamlet text entry
!(function(){
  var sel = d3.select('.hamlet-edit').html('')
    .st({textAlign: 'center', marginTop: 17})
    .on('keydown', function(){
      sel.classed('changed', 1)
      if (d3.event.keyCode != 13) return
      d3.event.preventDefault()

      update()
    })

  var sent = sents[0]

  var inputSel = sel.append('textarea').at({cols: 30})
  inputSel.node().value = sent.str

  // sel.append('div')
  sel.append('button.button.update').on('click', update).text('Update Sentence')
    .st({width: 140, height: 47, marginLeft: 20, marginTop: 0, top: -19, marginRight: 0})


  function update(){
    sent.str = inputSel.node().value

    sel.classed('changed', 0)
    initSent(sent)
  }
})()


// Footnotes
!(function(){
  var footnums = '¹²³⁴⁵⁶⁷⁸⁹'

  var footendSel = d3.selectAll('.footend')
    .each(function(d, i){
      var sel = d3.select(this)
      var ogHTML = sel.parent().html()
      sel
        .at({href: '#footstart-' + i, id: 'footend-' + i})
        .text(footnums[i])
        .datum(ogHTML)
    })


  var footstartSel = d3.selectAll('.footstart')
    .each(function(d, i){
      d3.select(this)
        .at({
          href: '#footend-' + i,
        })
        .text(footnums[i])
        .parent().at({id: 'footstart-' + i})
    })
    .on('mouseover', function(d, i){
      ttSel
        .html(footendSel.data()[i])
        .select('.footend').remove()

      var x = this.offsetLeft,
          y = this.offsetTop,
          bb = ttSel.node().getBoundingClientRect(),
          left = d3.clamp(20, (x-bb.width/2), window.innerWidth - bb.width - 20),
          top = innerHeight + scrollY > y + 20 + bb.height ? y + 20 : y - bb.height - 10;

      ttSel.st({left, top}).classed('tooltip-hidden', false)
    })

    footstartSel.on('mousemove',mouseover).on('mouseout', mouseout)
    ttSel.on('mousemove', mouseover).on('mouseout', mouseout)
    function mouseover(){
      if (window.__ttfade) window.__ttfade.stop()
    }
    function mouseout(){
      if (window.__ttfade) window.__ttfade.stop()
      window.__ttfade = d3.timeout(() => {
        ttSel.classed('tooltip-hidden', true)
      }, 250)
    }



  d3.selectAll('#sections wee, #graph .weepeople').attr('aria-hidden', true)

})()





// // Populate interesting alts
// !(() => {
//   var listSel = d3.select('.interesting-list').st({display: 'none'})

//   var listStr = listSel.text()

//   _.last(pairs).alts = listStr.split('-').map(d => d.trim()).filter(d => d).map(rawStr => {
//     var start = rawStr.split('[')[0]
//     var end = rawStr.split(']')[1]

//     var [t0, t1] = rawStr.split('[')[1].split(']')[0].split('|')
//     var s0 = start + t0 + end
//     var s1 = start + t1 + end

//     var str = `<div style=display:inline-block>${start} 
//       <span style=color:${util.colors[1]}>${t1}</span>|<span
//             style=color:${util.colors[0]}>${t0}</span>
//       ${end}</div>`.replace('_', '____')

//     return {str, s0, s1}
//   })
// })()

// // Populate difference in difference
// !(() => {
//   var listSel = d3.select('.difference-difference-list').st({display: 'none'})

//   var listStr = listSel.text()

//   diffs[0].alts = listStr.split('-').map(d => d.trim()).filter(d => d).map(rawStr => {
//     var start = rawStr.split('[')[0]
//     var end = rawStr.split(']')[1]

//     var [t0, t1] = rawStr.split('[')[1].split(']')[0].split('|')
//     var s0 = start + t0 + end
//     var s1 = start + t1 + end

//     var str = `<div style=display:inline-block>${rawStr}</div>`.replace('_', '____')


//     return {str, s0, s1, rawStr}
//   })
// })()
