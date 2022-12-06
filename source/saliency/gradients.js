/* Copyright 2022 Google LLC. All Rights Reserved.

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

window.initGradients = async function(){

  var sel = d3.select('.gradients').html(`
  <div class='title-grads'></div>
  <div class='input-and-grads'></div>
  <div class='picker'></div>
  <div class='methods-buttons'></div>
  <div class='viz-title'></div>
  `)
  if (!sel.node()) return console.log('missing .gradients')

  var titleVizSel = sel.select('div.viz-title').html('')
    .st({marginBottom: 0})

  var imgsToDraw = [
    {title: `Input Image`, model: 'input'},
    {title: `Normal Model`, model: 'N'},
    {title: `Watermark Model`, model: 'PC100'}
  ]

  var containerSize = $(".input-and-grads").width()

  var titleSel = sel.select('.title-grads').html('')
    .appendMany('div.title-container', imgsToDraw)
    .st({width: containerSize/3})
    .append('div.legend')
    .html(d => d.title)
    
  var imgsContainerSel = sel.select('.input-and-grads').html('')
    .append('div.imgs-container')

  var gapBtwImgs = 5
  var imgSize = (containerSize - gapBtwImgs*2)/3

  var imgDivSel = imgsContainerSel.appendMany('div', imgsToDraw)
    .st({width: imgSize, height: imgSize})

  var imgSel = imgDivSel.append('img')
    .st({width: '100%'})

  var imgPickerSel = sel.select('.picker').html('')
    .st({marginTop: 10})

  var gapBtwnThum = 2
  var thumbnailWidth = (containerSize - gapBtwnThum*30)/31

  var watermarkImgs = window.dataGrad

  var thumbnailSel = imgPickerSel.append('div.img-picker-grad')
    .appendMany('div.container-img', watermarkImgs)
    .st({width: thumbnailWidth, aspectRatio: 1/1, cursor: 'pointer'})
    .append('img')
    .at({width: '100%', src: d => d.src})
    .on('mouseover', d => {
      activeImg = d
      renderImgs()
    })

  function renderImgs(){
    imgSel.each(function(d) {
      if (d.model == 'input') {
        activeImg.src = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/inputs/${activeImg.name}.jpg`
        d3.select(this).at({src: activeImg.src})
      }
      else {
        activeImg.srcGrad = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/${method}/${d.model}/${activeImg.name}.jpg`
        d3.select(this).at({src: activeImg.srcGrad})
      }
    })
  }

  var method = 'vanilla_grad'
  var activeImg = window.dataGrad[1]
  renderImgs()


}
  

if (window.init) window.init()
