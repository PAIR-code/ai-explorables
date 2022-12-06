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

window.initQuadrants = async function(slug) {
  var sel = d3.select('.quadrants-' + slug).html(`
    <div class='viz-title'></div>
    <div class='controls-top'></div>
    <div class='quadrants-container'></div>
    <div class='controls-bottom'></div>
    <div class='eval-legend'></div>
    `)
  if (!sel.node()) return console.log('missing .quadrants-' + slug)

  // Control Buttons
  var controlsTopContSel = sel.select('.controls-top').html('')
  var controlsTopTitleSel = controlsTopContSel.append('div.controls-titles')
  var controlsTopSel = controlsTopContSel.append('div.controls-buttons')

  var controlsBottomContSel = sel.select('.controls-bottom').html('')
  var controlsBottomSel = controlsBottomContSel.append('div.controls-buttons')
    .st({marginTop: 20, justifyContent: 'center'})

  var models = [
    {text:'0%', id:'N'},
    {text:'25%', id:'PC25'},
    {text:'50%', id:'PC50'},
    {text:'75%', id:'PC75'},
    {text:'100%', id:'PC100'}
  ]

  // Create 4 quadrants
  var titleVizSel = sel.select('div.viz-title').html('')
  var quadrants = [
    {legend: `Cats <span class='emoji'>🐱</span> with <span class='wrong'>watermarks</span>`, class: 'cat', wm: 1},
    {legend: `Dogs <span class='emoji'>🐶</span> with <span class='wrong'>watermarks</span>`, class: 'dog', wm: 1},
    {legend: `Cats <span class='emoji'>🐱</span> without watermarks`, class: 'cat', wm: 0},
    {legend: `Dogs <span class='emoji'>🐶</span> without watermarks`, class: 'dog', wm: 0},
  ]

  var quadContainerWidth = $(".quadrants-container").width()
  var gapBtwQuads = 10

  var quadrantDivSel = sel.select('.quadrants-container').html('')
    .appendMany('div.quadrant-container', quadrants)
    .st({width: (quadContainerWidth - gapBtwQuads)/2})

  var quadrantTitleSel = quadrantDivSel
    .append('div.title-container')
    .append('div.legend')
    .html(d => d.legend)
    .st({fontWeight: '300'})

  function setActiveGrad(grad){
    gradButtonSel.classed('active', e => e == grad)
    activeGrad = grad
    renderImgs()
  }

  if (slug == 'intro'){

    titleVizSel.html(`Saliency maps for the Watermark Model`)

    var quadrantSel = quadrantDivSel.append('div.quadrant')
    
    const classNames = ['cat', 'dog']
    const positions = ['left-intro', 'right-intro']

    positions.forEach((pos, i) => {
      quadrantSel
        .filter(d => d.class == classNames[i])
        .at({class: 'quadrant no-scroll-bar scroller-' + pos})

      $('.scroller-' + pos).scroll(function(e){
        $('.scroller-' + pos).scrollTop(e.target.scrollTop);
      })
    })
    
    var inputsOrGrads = [
      {text:'Input Images', method: 'inputs'},
      {text:'Vanilla Gradient', method: 'vanilla_grad'},
      {text:'Gradient Squared', method: 'grad_squared'}
    ]

    var gradButtonSel = controlsBottomSel.append('div.buttons')
      .appendMany('div', inputsOrGrads)
      .text(d => d.text)

    gradButtonSel.on('click', d => {
      setActiveGrad(d)
    })

    function renderImgs() {
      quadrantSel.each(function(quadrants) {

        var data = window.dataQuad.filter(d => d.truth == quadrants.class && d.watermarked == quadrants.wm && d.model == 'PC100')

        data.forEach(d => {
          d.srcGradVG = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/vanilla_grad/PC100/${d.name}.jpg`
          d.srcGradSG = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/grad_squared/PC100/${d.name}.jpg`
        })

        var margin = 2
        var quadrantWidth = $(".quadrant").width()
        var nbImgsRow = innerWidth < 800 ? 2 : 4
        var containerItemWidth = (quadrantWidth - margin*2*(nbImgsRow + 1))/nbImgsRow

        var containerItemSel = d3.select(this).html('').appendMany('div.container-item', data)
          .st({width: containerItemWidth, aspectRatio: 1 / 1, margin: margin})

        var containerImgSel = containerItemSel.append('div.container-img')

        var inputImgSel = containerImgSel.append('img')
          .at({width: '100%', src: d => d.src})
          .st({pointerEvent: 'none'})

        var vanillaGradImgSel = containerImgSel.append('img')
          .at({width: '100%', src: d => d.srcGradVG})
          .st({opacity: activeGrad.method == 'vanilla_grad' ? 0.9 : 0})
          .st({pointerEvent: 'none'})
        
        var squaredGradImgSel = containerImgSel.append('img')
          .at({width: '100%', src: d => d.srcGradSG})
          .st({opacity: activeGrad.method == 'grad_squared' ? 0.9 : 0})
          .st({pointerEvent: 'none'})

        var predictionSel = containerItemSel
          .append('div').st({width: '100%', display: 'flex', justifyContent: 'center'})
          .append('div.pred')
          .text(d => d.predClass + ' ' + d3.format('0.0%')(d.predAcc))
          .st({
            backgroundColor: d => d.predClass == 'cat' ? window.colors.cat : window.colors.dog,
            color: '#fff'
          })
      })

    }
    activeModel = models[0]
    setActiveGrad(inputsOrGrads[1])
  }
  
  if (slug == 'fifty') {

    titleVizSel.html(`Saliency maps for a model trained on a dataset where 50% of cat images are watermarked`)

    var quadrantSel = quadrantDivSel.append('div.quadrant')
    
    const classNames = ['cat', 'dog']
    const positions = ['left-fifty', 'right-fifty']

    positions.forEach((pos, i) => {
      quadrantSel
        .filter(d => d.class == classNames[i])
        .at({class: 'quadrant no-scroll-bar scroller-' + pos})

      $('.scroller-' + pos).scroll(function(e){
        $('.scroller-' + pos).scrollTop(e.target.scrollTop);
      })
    })

    var inputsOrGrads = [
      {text:'Input Images', method: 'inputs'},
      {text:'Gradient Squared', method: 'grad_squared'}
    ]

    inputsOrGrads.forEach((d,i) => d.opacity = i == 0 ? 0 : 0.9)
    inputsOrGrads.forEach((d, i) => d.method = 'inputs grad_squared'.split(' ')[i])
    
    var gradButtonSel = controlsBottomSel.append('div.buttons')
      .appendMany('div', inputsOrGrads)
      .text(d => d.text)

    gradButtonSel.on('click', d => {
      setActiveGrad(d)
      })


    // render a grid of images for each quadrant. showGradients indicates whether to display gradients, i.e. set non null opacity
    function renderImgs() {
      quadrantSel.each(function(quadrants) {

        var data = window.dataQuad.filter(d => d.truth == quadrants.class && d.watermarked == quadrants.wm && d.model == 'PC50')

        data.forEach(d => {
          d.srcGradVG = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/vanilla_grad/PC50/${d.name}.jpg`
          d.srcGradSG = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/grad_squared/PC50/${d.name}.jpg`
       })

        var margin = 2
        var quadrantWidth = $(".quadrant").width()
        var nbImgsRow = innerWidth < 800 ? 2 : 4
        var containerItemWidth = (quadrantWidth - margin*2*(nbImgsRow + 1))/nbImgsRow

        var containerItemSel = d3.select(this).html('').appendMany('div.container-item', data)
          .st({width: containerItemWidth, aspectRatio: 1 / 1, margin: margin})

        var containerImgSel = containerItemSel.append('div.container-img')

        var inputImgSel = containerImgSel.append('img')
          .at({width: '100%', src: d => d.src})
          .st({pointerEvent: 'none'})
        
        var squaredGradImgSel = containerImgSel.append('img')
          .at({width: '100%', src: d => d.srcGradSG})
          .st({opacity: activeGrad.method == 'grad_squared' ? 0.9 : 0})
          .st({pointerEvent: 'none'})

        var predictionSel = containerItemSel
          .append('div').st({width: '100%', display: 'flex', justifyContent: 'center'})
          .append('div.pred')
          .text(d => d.predClass + ' ' + d3.format('0.0%')(d.predAcc))
          .st({
            backgroundColor: d => d.predClass == 'cat' ? window.colors.cat : window.colors.dog,
            color: '#fff'
          })
      })

    }
  
    activeModel = models[0]
    setActiveGrad(inputsOrGrads[1])
  }

  if (slug == 'eval-0' || slug == 'eval-100' || slug == 'eval-50') {
    quadrantTitleSel.st({marginTop: 10, width: '70%', textAlign: 'center'})

    var quadrantSel = quadrantDivSel.append('div.quadrant')
      .st({outline: 'none', overflow: 'visible'})

    function setActiveModel(model){
      activeModel = model
      updateGraphs()
    }

    sel.select('.eval-legend').html(`
      <span class='cat circle'></span>
      Model predicts cat
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;      
      <span class='dog circle'></span> 
      Model predicts dog
    `)

    // Render 4 graphs, one in each quadrant

    var radius = 2
    var previousPositions = []
    function initGraphs() {
      quadrantSel.each(function(quadrant){
        var data = window.dataQuad.filter(d => d.truth == quadrant.class && d.watermarked == quadrant.wm && d.model == activeModel.id)
        var c = d3.conventions({
          sel: d3.select(this).html(''),
          height: 80,
          margin: {left: 20, top: 0, bottom: 10},
        })

        c.xAxis.ticks(5).tickFormat(d3.format('.0%'))

        d3.drawAxis(c)
        c.svg.select('.y').remove()
        var ticks = c.svg.selectAll('g.tick')
          .select('text')
          .at({fill: '#000'})

        c.svg.select('.x')
          .append('g')
          .translate([c.width/2, -2])
          .append('text')
          .text(innerWidth < 800 ? 
            '% of salient pixels near watermark' :
            `Proportion of salient pixels in the watermark area → `)
          .at({textAnchor: 'middle'})
          .st({fill: '#000', fontSize: 10})

        c.svg.append('rect.bg-rect')
          .at({width: c.width, height: c.height, fill: '#eee', opacity: .5})
          .lower()

        data.forEach(d => {
          d.x = c.x(d.proportion)
          d.y = 0
        })

        quadrant.circleSel = c.svg.appendMany('circle', data)
          .at({r: radius, stroke: '#000'})
          .translate(d => [d.x, d.y + c.height/2])
          .call(d3.attachTooltip)
          .on('mouseover', function(d) {
            tooltipSel = window.ttSel.html('').st({width: 203})
            ttImgContainerSel = tooltipSel.append('div.tooltip-container')
            ttInputImgSel = ttImgContainerSel
              .append('div.container-item')
              .st({width: 100, aspectRatio: 1 / 1})
            ttInputImgSel.append('img.tooltip-img').at({width: '100%', src:`${d.src}`})
            ttInputImgSel.append('div').st({width: '100%', justifyContent: 'center'})
              .append('div.pred')
              .text(`${d.predClass} ${d3.format('0.1%')(d.predAcc)}`)
              .st({
                fontSize: '70%',
                backgroundColor: `${d.predClass}` == 'cat' ? window.colors.cat : window.colors.dog,
                color: '#fff'
              })
            ttImgContainerSel
              .append('img.tooltip-img')
              .at({width: '100%', src: `${d.srcGrad}`})
              .st({marginLeft: 3})

            d3.select(this).raise()
          })

        quadrant.prevData = data
        quadrant.c = c 
      })
    }

    function updateGraphs() {
      if (!quadrantSel.datum().c) initGraphs()

      quadrantSel.each(function (quadrant){
        var {prevData, c} = quadrant

        var data = window.dataQuad.filter(d => d.truth == quadrant.class && d.watermarked == quadrant.wm && d.model == activeModel.id)
        data.forEach(d => {
          d.srcGrad = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/grad_squared/${activeModel.id}/${d.name}.jpg`
          d.srcGradWmFree = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/grad_squared/${activeModel.id}/${d.nameOrigin}.jpg`
          d.srcGradWm = `https://storage.googleapis.com/uncertainty-over-space/explorables/saliency/images/saliency_maps/grad_squared/${activeModel.id}/${d.nameOrigin}_wm.jpg`
        })

        prevData.forEach((d, i) => {
          data[i].x = prevData[i].x
          data[i].y = prevData[i].y/2
        })

        var simulation = d3.forceSimulation(data)
          .force("x", d3.forceX(function(d) { return c.x(d.proportion); }).strength(0.5))
          .force("y", d3.forceY(d => d.y))
          .force("collide", d3.forceCollide(radius + 1))
          .stop();
    
        for (var i = 0; i < 150; ++i) simulation.tick();
        
        quadrant.circleSel
          .data(data)
          .transition()
          .duration(500)
          .at({
            r: radius + 1,  
            fill: d => d.predClass == 'cat' ? colors.cat : colors.dog,
            stroke: d => '#000'
          })   
          .translate(d => [d.x, d.y + c.height/2])

        quadrant.prevData = data
      })
    }

    if (slug == 'eval-0'){
      titleVizSel.html(`Proportion of salient pixels pointing to the watermak area for the 0% Model`)
        .append('span.info-span')
        .datum({info: `0% of cat images used to train this model were watermarked.`})
        .st({cursor: 'default'})
      setActiveModel(models[0])
    }

    if (slug == 'eval-100'){
      titleVizSel.html(`Proportion of salient pixels pointing to the watermak area for the 100% Model`)
        .append('span.info-span')
        .datum({info: `100% of the cat images used to train this model were watermarked.`})
        .st({cursor: 'default'})
      setActiveModel(models[4])
    }

    if (slug == 'eval-50'){
      titleVizSel.html(`Proportion of salient pixels pointing to the watermak area for the <span class='select-model'></span> Model`)
        .append('span.info-span')
        .datum({info: `Percentage of cat images in the training data that are watermarked.`})
        .st({cursor: 'default'})
  
      function setActiveModel(model){
        // modelButtonSel.classed('active', e => e == model)
        activeModel = model
        updateGraphs()
      }
      setActiveModel(models[2])
    }

    modelsMiddle = models.filter(d => d.id != 'N' && d.id != 'PC100')

    var modelButtonSel = sel.select('span.select-model')
      .append('select.dropdown.button')
      .on('change', function() {
        modelsMiddle.forEach(m => {
          if (m.text == this.value) activeModel = m
        })
        setActiveModel(activeModel)
        // sel.select('.annotation-container').remove()
      })

    var options = modelButtonSel
      .appendMany('option', modelsMiddle)
      .st({fontWeight: 200, textDecoration: 'none'})
      .text(d => d.text)

    options.filter(d => d.id == 'PC50')
      .at({selected: true})

    sel.selectAll('span.info-span')
      .text(' ⓘ')
      .st({fontWeight: 200, textDecoration: 'none'})
      .each(function(d){
        d3.select(this).datum(d.info)
      })
      .call(window.addLockedTooltip, {noHover: true})
  
  }

}

if (window.init) window.init()