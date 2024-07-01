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

/*
to update arrows:
  1. set isDraggable = true
  2. tweaks arrows by dragging them
  3. run this in the dev tools: 
     copy('window.annotations = ' + JSON.stringify(window.annotations, null, 2))
  4. paste below
*/

window.annotations = [
  {
    'parent': '.occlusion-manual',
    'html':
      'Hover to see how the model predictions change when part of the image is occluded',
    'st': {
      'top': 100,
      'left': 10,
      'width': 200,
    },
    'maxWidth': 950,
    'path': 'M 74,-7 A 101.366 101.366 0 0 0 183,87',
  },
  {
    'parent': '.quadrants-eval-0',
    'html':
      "The unbiased model doesn't use the pixels in the bottom left corner to make a prediction.",
    'st': {
      'top': 170,
      'left': -180,
      'width': 165,
    },
    'path': 'M 64,-95 A 96.613 96.613 0 0 1 170,-152',
  },
  {
    'parent': '.quadrants-eval-100',
    'html':
      'Adding a watermark on images changes the prediction. Saliency maps correctly flag the bias for those images.',
    'st': {
      'top': 170,
      'left': 780,
      'width': 165,
    },
    'path': 'M 56,-109 A 78.754 78.754 0 0 0 -27,-164',
  },
  {
    'parent': '.quadrants-eval-100 .quadrant',
    'html':
      "Some saliency maps don't pick up at all the bottom left corner for watermark-free images, although they are misclassified.",
    'st': {
      'top': 35,
      'left': -180,
      'width': 165,
    },
    'path': 'M 81,-10 A 76.298 76.298 0 0 0 181,36.00000762939453',
  },
  {
    'parent': '.quadrants-eval-50',
    'html':
      'Many dog images are misclassified as cats, likely because they have watermarks. Saliency maps helpfully point to the bottom left corner.',
    'st': {
      'top': 170,
      'left': 780,
      'width': 165,
    },
    'path': 'M 56,-109 A 78.754 78.754 0 0 0 -27,-164',
  },
  {
    'parent': '.quadrants-eval-50 .quadrant',
    'html':
      'Many cat images are misclassified as dogs, likely because they don’t have watermarks, but very few saliency maps highlight the bias.',
    'st': {
      'top': 30,
      'left': -180,
      'width': 165,
    },
    'path': 'M 81,-10 A 76.298 76.298 0 0 0 181,36.00000762939453',
  },
  {
    'parent': '.other-cheats',
    'html':
      'Can you guess what bias these models have? Click on a Mystery Model box to reveal its bias (if any).',
    'st': {
      'top': 100,
      'left': 680,
      'width': 170,
    },
    'path': 'M 61,-88 A 91.93 91.93 0 0 0 -37,-149',
  },
];

window.initSwoopy = function () {
  d3.selectAll('.annotation-container').remove();

  annotations.forEach((d, i) => {
    var isDraggable = 0;

    var sel = d3
      .select(d.parent)
      .st({position: 'relative'})
      .selectAppend('div.annotation-container')
      .classed('is-draggable', isDraggable)
      .html('')
      .st(d.st);

    if (d.maxWidth && d.maxWidth > window.innerWidth) {
      sel.st({display: 'none'});
    }
    if (d.mobileSt && 800 > window.innerWidth) {
      sel.st(d.mobileSt);
    }

    sel.append('div').html(d.html);

    var swoopy = d3
      .swoopyDrag()
      .x((d) => 0)
      .y((d) => 0)
      .draggable(isDraggable)
      .annotations([d]);

    sel.append('svg').at({width: 1, height: 1}).call(swoopy);
    if (isDraggable) {
      sel.select('svg').append('circle').at({r: 4, fill: 'none'});
    }
  });

  d3.select('body')
    .selectAppend('svg.arrow-svg')
    .html('')
    .st({height: 10})
    .append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '-10 -10 20 20')
    .attr('markerWidth', 20)
    .attr('markerHeight', 20)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M-10,-10 L 0,0 L -10,10')
    .st({stroke: '#000', fill: 'none'});

  d3.selectAll('.annotation-container path').at({
    markerEnd: 'url(#arrow)',
    strokeWidth: 0.5,
    opacity: (d) => (d.path == 'M 0 0' ? 0 : ''),
  });
};

if (window.init) window.init();
