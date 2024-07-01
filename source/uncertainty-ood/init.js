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

var scale = 10;
// var LABEL_NAMES = ['t_shirt', 'trouser', 'pullover', 'dress', 'coat', 'sandal', 'shirt', 'sneaker', 'bag', 'ankle_boots']
var LABEL_NAMES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
];

// Binary model corresponds to class 0 and 1 above

window.init = function () {
  console.clear();

  var nums = d3.range(10).map((i) => 'num_' + i);
  var orgNums = 'img_1 img_2 img_3 img_4 img_5 img_6 img_7'.split(' ');
  var fashion = 'ankle_boot dress pullover shirt trouser'.split(' ');
  var letters = 'letter_a letter_b letter_c letter_e letter_g'.split(' ');
  var scribbles = 'scribble_0 scribble_1'.split(' ');

  draw_canvas_mnist_single('paint-container-iid', nums, 'num_0');
  draw_canvas_mnist_single(
    'paint-container-ood',
    [fashion, letters, scribbles].flat(),
    'letter_b',
  );
  draw_canvas_mnist_ensemble(
    'mnist-ensemble',
    [nums, fashion, letters, scribbles].flat(),
    'num_8',
  );
};
window.init();

// if (innerWidth < 800){
//   setTimeout(initMobileScaling, 1000)
//   setTimeout(initMobileScaling, 3000)
//   // window.__mobileInterval?.stop()
//   // window.__mobileInterval = d3.interval(initMobileScaling, 500)
// }
