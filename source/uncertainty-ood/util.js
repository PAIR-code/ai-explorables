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

window.util = (function () {
  function reshape_image(ctx) {
    var img_data = ctx.getImageData(0, 0, 28, 28).data;
    var output_tensor = [];
    for (let i = 0; i < img_data.length; i++) {
      if (i % 4 == 0) {
        output_tensor.push(img_data[i] / 255); // TODO: divide by 255?
      }
    }
    return tf.tensor(output_tensor, [1, 28, 28, 1]);
  }

  function reshape_image_mnist(ctx) {
    var imgData = ctx.getImageData(0, 0, 28, 28);
    var inputArray = [];
    for (let i = 0; i < imgData.data.length; i++) {
      if (i % 4 == 0) {
        inputArray.push(imgData.data[i] / 255);
      }
    }

    return {imgData, inputTensor: tf.tensor(inputArray, [1, 28, 28, 1])};
  }

  function getTopKClasses(values, topK) {
    const valuesAndIndices = [];
    for (let i = 0; i < values.length; i++) {
      valuesAndIndices.push({value: values[i], index: i});
    }
    valuesAndIndices.sort((a, b) => {
      return b.value - a.value;
    });
    const topkValues = new Float32Array(topK);
    const topkIndices = new Int32Array(topK);
    for (let i = 0; i < topK; i++) {
      topkValues[i] = valuesAndIndices[i].value;
      topkIndices[i] = valuesAndIndices[i].index;
    }

    const topClassesAndProbs = [];
    for (let i = 0; i < topkIndices.length; i++) {
      topClassesAndProbs.push({
        className: LABEL_NAMES[topkIndices[i]],
        probability: topkValues[i],
      });
    }
    return topClassesAndProbs;
  }

  function initDrawCanvas({sel, predict}) {
    var canvasSel = sel
      .select('canvas')
      .at({width: 28, height: 28})
      .st({width: 280, height: 280});
    var ctx = canvasSel.node().getContext('2d', {willReadFrequently: true});

    var drag = d3
      .drag()
      .container(canvasSel.node())
      .subject((d) => [d3.event.x - 1, d3.event.y - 1])
      .on('drag', () => {
        var d = d3.event.subject;
        var cur = [d3.event.x / scale, d3.event.y / scale];
        var prv = _.last(d);
        d.push(cur);

        ctx.strokeStyle = d3.event.sourceEvent.shiftKey ? '#000' : '#fff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(prv[0], prv[1]);
        ctx.lineTo(cur[0], cur[1]);
        ctx.closePath();
        ctx.stroke();

        predict();
      });
    canvasSel.call(drag);

    return ctx;
  }

  function initImgPicker({sel, predict, ctx, imgList, imgClickCb}) {
    sel
      .select('.img-picker')
      .html('')
      .st({lineHeight: 0})
      .appendMany(
        'img',
        imgList.map((d) => `img/${d}.jpg`),
      )
      .at({width: 1200 / 27, height: 800 / 27, src: (d) => d})
      .st({paddingRight: 4, paddingBottom: 4, cursor: 'pointer'})
      .on('click', (d) => {
        var img = new Image();
        img.addEventListener('load', function () {
          if (imgClickCb) {
            var tensor0 = util.reshape_image_mnist(ctx).inputTensor;
            ctx.drawImage(img, 0, 0);
            var tensor1 = util.reshape_image_mnist(ctx).inputTensor;
            imgClickCb(tensor0, tensor1);
          } else {
            ctx.drawImage(img, 0, 0);
            predict();
          }
        });
        img.src = d;
      });
  }

  function renderBigPrediction(sel, results) {
    var maxVal = d3.max(results);
    var topIndex = results.indexOf(maxVal);

    var color = util.digitColor[topIndex];
    var percent = d3.format('.1%')(maxVal);
    sel.select('.prediction').html(`
      <div class='big-prediction' style='color:${color}'>${topIndex}</div>

      <div class='prediction-container'>
        <div style='width:100%; opacity:.2; background:${color}'>&nbsp;</div>
        <div style='width:${percent}; background:${color}'>&nbsp;</div>
        <div class='percentage'>${percent}</div>
      </div>
      <div class='confidence'>Confidence</div>
    `);
  }

  var digitColor = d3.schemeCategory10;

  return {
    reshape_image,
    reshape_image_mnist,
    getTopKClasses,
    initDrawCanvas,
    initImgPicker,
    digitColor,
    renderBigPrediction,
  };
})();

if (window.init) window.init();
