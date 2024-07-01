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

window.initOcclusion = async function (slug, occlusionState) {
  var sel = d3.select('.occlusion-' + slug).html(`
  <div class='main-container'></div>
  <div class='controls-occlusion'></div>
  <div class='img-picker'></div>
  <div class='caption'></div>
  `);
  if (!sel.node()) return console.log('missing .occlusion-' + slug);

  var imgSize = 280;
  var controlSel = sel.select('.controls-occlusion');

  async function predict(canvasNode, tfmodel) {
    var resized = tf.browser
      .fromPixels(canvasNode)
      .resizeBilinear([imgSize, imgSize])
      .reshape([1, imgSize, imgSize, 3])
      .div(255);

    var results = await tfmodel.predict(resized).dataSync();

    var predictions = [
      {className: 'cat', probability: results[0]},
      {className: 'dog', probability: results[1]},
    ];
    if (results[0] < results[1]) predictions.reverse();
    return predictions;
  }

  if (slug == 'manual') {
    var mainContSel = sel.select('.main-container').html('');
    var canvasContSel = sel
      .select('.main-container')
      .st({marginTop: 70})
      .append('container-canvas');
    var drawSel = canvasContSel.append('div.img-draw');
    var canvasSel = drawSel
      .append('canvas')
      .at({width: imgSize, height: imgSize});
    var svgSel = drawSel.append('svg').at({width: imgSize, height: imgSize});
    var imgPickerSel = sel.select('.img-picker').html('');
    var canvasNode = canvasContSel.select('canvas').node();
    var ctx = canvasNode.getContext('2d');
    var predictionsSel = mainContSel
      .append('div.predictions')
      .append('div.pred-container')
      .st({width: imgSize})
      .appendMany('div', modelsIntro);

    function setActiveImg() {
      var activeImg = occlusionState.activeImg;
      activeImg.img = new Image();
      activeImg.img.addEventListener('load', function () {
        ctx.drawImage(activeImg.img, 0, 0);

        predictionsSel.each(function (modelIntro, i) {
          var predictionSel = d3.select(this);
          render(modelIntro.tfmodel, predictionSel);
        });
      });
      activeImg.img.src = activeImg.src;
    }
    occlusionState.renderFns.push(setActiveImg);

    async function drawPredictions(tfmodel, predictionSel) {
      var predictions = await predict(canvasNode, tfmodel);
      predictionSel
        .html('')
        .append('div.legend')
        .html((d) => d.subtitle)
        .st({textAlign: 'center'});
      predictionSel
        .append('div.pred')
        .text(
          (d) =>
            predictions[0].className +
            ' ' +
            d3.format('.1%')(predictions[0].probability),
        )
        .st({
          backgroundColor: (d) =>
            predictions[0].className == 'dog'
              ? colorScale(predictions[0].probability)
              : colorScale(1 - predictions[0].probability),
          color: '#fff',
        });
    }

    var bodyWidth = $('body').width();
    var nbThumbnails = localImgs.length;
    var gap = 3;
    var thumbnailImgs = imgPickerSel
      .appendMany('img', localImgs)
      .at({
        width: (bodyWidth - gap * (nbThumbnails - 1)) / nbThumbnails,
        src: (d) => d.src,
      })
      .st({cursor: 'pointer'})
      .on('mouseover', (d) => {
        grid.boxes.forEach((d) => (d.isHidden = false));
        occlusionState.activeImg = d;
        occlusionState.renderFns.forEach((fn) => fn());
      });

    // Render grid on input
    function initGrid() {
      var numBoxes = occlusionState.numBoxes;
      var boxHeight = imgSize / numBoxes;
      var boxes = d3.cross(d3.range(numBoxes), d3.range(numBoxes));
      var scale = d3.scaleLinear().domain([0, numBoxes]).range([0, imgSize]);
      var boxSel = svgSel
        .html('')
        .appendMany('rect', boxes)
        .at({
          width: imgSize / numBoxes,
          height: imgSize / numBoxes,
          x: (d) => scale(d[1]),
          y: (d) => scale(d[0]),
          fillOpacity: 0,
          stroke: '#ccc',
          // cursor: 'pointer'
        })
        .on('mouseover', (d) => {
          d.isHidden = true;
          updatePredictions();
        })
        .on('mouseout', (d) => {
          d.isHidden = false;
          updatePredictions();
        });

      function updatePredictions() {
        predictionsSel.each(function (modelsIntro) {
          var predictionSel = d3.select(this);
          var tfmodel = modelsIntro.tfmodel;
          render(tfmodel, predictionSel);
        });
      }

      return {
        boxes,
        scale,
        boxHeight,
        numBoxes: occlusionState.numBoxes,
      };
    }

    var render = async function (model, sel) {
      if (grid.numBoxes != occlusionState.numBoxes) grid = initGrid();

      ctx.drawImage(occlusionState.activeImg.img, 0, 0);
      ctx.beginPath();
      grid.boxes.forEach((d) => {
        if (!d.isHidden) return;
        ctx.rect(
          grid.scale(d[1]),
          grid.scale(d[0]),
          grid.boxHeight,
          grid.boxHeight,
        );
      });
      ctx.fill();

      drawPredictions(model, sel);
    };

    var grid = initGrid();
  }

  if (slug == 'auto') {
    var modelSel = sel
      .select('.main-container')
      .html('')
      .appendMany('container-canvas', modelsIntro);

    modelSel
      .append('div.legend')
      .append('div.legend')
      .html((d) => d.subtitle)
      .st({textAlign: 'center'});

    var controlSel = sel.select('.controls-occlusion');
    var drawSel = modelSel.append('div.img-draw');
    var canvasSel = drawSel
      .append('canvas')
      .at({width: imgSize, height: imgSize});
    var svgSel = drawSel.append('svg').at({width: imgSize, height: imgSize});
    var imgPickerSel = sel.select('.img-picker').html('');

    // Render auto occlusion map
    var isFirstLoad = true;
    function setActiveImg() {
      modelSel.each(function (model) {
        var sel = d3.select(this);
        var canvasNode = sel.select('canvas').node();
        var ctx = canvasNode.getContext('2d');
        var activeImg = occlusionState.activeImg;
        activeImg.img = new Image();
        activeImg.img.addEventListener('load', async function () {
          ctx.drawImage(activeImg.img, 0, 0);

          if (!isFirstLoad) {
            render(sel, model);
          }
          isFirstLoad = false;
        });
        activeImg.img.src = activeImg.src;
      });
    }
    occlusionState.renderFns.push(setActiveImg);

    var render = async function (sel, model) {
      var canvasNode = sel.select('canvas').node();
      var ctx = canvasNode.getContext('2d');

      ctx.fill();

      var numBoxes = occlusionState.numBoxes;
      var boxHeight = imgSize / numBoxes;
      var boxes = d3.cross(d3.range(numBoxes), d3.range(numBoxes));
      var scale = d3.scaleLinear().domain([0, numBoxes]).range([0, imgSize]);
      var grid = (model.activeGrid = d3.cross(
        d3.range(numBoxes),
        d3.range(numBoxes),
      ));

      var boxSel = sel
        .select('svg')
        .html('')
        .appendMany('rect', grid)
        .at({
          width: imgSize / numBoxes,
          height: imgSize / numBoxes,
          x: (d) => scale(d[1]),
          y: (d) => scale(d[0]),
          stroke: '#000',
          strokeWidth: 0.5,
          fillOpacity: 0.5,
        });

      for (let cell of grid) {
        if (grid != model.activeGrid) break;
        await new Promise((resolve) => setTimeout(resolve, 1));
        ctx.drawImage(occlusionState.activeImg.img, 0, 0);
        ctx.beginPath();
        ctx.rect(scale(cell[1]), scale(cell[0]), boxHeight, boxHeight);
        ctx.fill();

        cell.predictions = await predict(canvasNode, model.tfmodel);
        cell.proba = cell.predictions[0].probability;
        cell.color =
          cell.predictions[0].className == 'dog' ? cell.proba : 1 - cell.proba;

        boxSel.at({
          fillOpacity: (d) => (d == cell ? 0 : 0.5),
          fill: (d) => (d.predictions ? colorScale(d.color) : 'rgba(0,0,0,0)'),
          stroke: (d) => (d.predictions ? '' : '#000'),
        });
      }
      boxSel.st({fillOpacity: 0.5});
      ctx.drawImage(occlusionState.activeImg.img, 0, 0);
      return {
        boxes,
        scale,
        boxHeight,
        numBoxes: occlusionState.numBoxes,
      };
    };

    // Grid resolution slider
    var sliderInput = occlusionState.numBoxes;
    var sliderContainer = controlSel.append('div.slider-container');
    sliderContainer
      .append('div.legend')
      .text('Grid resolution')
      .st({fontSize: 14});
    sliderContainer
      .append('input.slider')
      .at({
        type: 'range',
        min: 2,
        max: 18,
        step: 1,
        value: occlusionState.numBoxes,
      })
      .on('input', function () {
        occlusionState.numBoxes = this.value;
        occlusionState.renderFns.forEach((fn) => fn());
      });

    var isIntersecting = false;
    let observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isIntersecting) {
          isIntersecting = true;
          modelSel.each(function (model) {
            var sel = d3.select(this);
            render(sel, model);
          });
        }
      },
      {threshold: 0.5},
    );
    observer.observe(sel.node());

    var captionSel = sel
      .select('.caption')
      .append('div')
      .st({display: 'flex', justifyContent: 'center'})
      .append('div')
      .st({width: 500, textAlign: 'center'})
      .html(
        `The color of each box shows what the model would predict (<span class='highlight cat'>cat</span> or <span class='highlight dog'>dog</span>) if the box was occluded`,
      )
      .st({fontStyle: 'italic', fontSize: 13, lineHeight: 17, maxWidth: 310});
  }
};
if (window.init) window.init();
