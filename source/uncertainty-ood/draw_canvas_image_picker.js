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

window.draw_canvas_image_picker = async function (
  className,
  imgList,
  initialImage,
) {
  var sel = d3
    .select('#' + className)
    .html(
      `
    <div class='canvas-container'>
      <div class='title'>Model Input</div>
      <canvas></canvas>
      <div class='img-picker'></div>
    </div>

    <div class='panel'>
      <div class='title'>Model Prediction</div>
      <div class='prediction'></div>
    </div>
  `,
    )
    .classed('paint-container', true);

  var ctx = util.initDrawCanvas({sel, predict});
  util.initImgPicker({sel, predict, ctx, imgList});

  var root =
    'https://storage.googleapis.com/uncertainty-over-space/explorables/uncertainty-ood/tfjs_models/overfit-epoch_2000';
  var model = await tf.loadLayersModel(`${root}/9/model.json`);

  var img = new Image();
  img.addEventListener('load', init);
  img.src = `img/${initialImage}.jpg`; /// Need to add parameter for folder and append here.

  function init() {
    ctx.drawImage(img, 0, 0);
    predict();
  }

  async function predict() {
    var results = await model.predict(util.reshape_image(ctx)).dataSync();
    util.renderBigPrediction(sel, results);
  }
};

if (window.init) window.init();
