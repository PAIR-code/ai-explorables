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


window.initMobileScaling = function(){
  window.graphics = [
    {
      sel: d3.select('.intro-models-watermark'),
      ariaLabel: 'Two diagrams side by side both displaying the same set of 50 images. On the left, we can see the predictions for Model A, on the right, the predictions for Model B. Both models classify correctly all 50 images.',
    },
    {
      sel: d3.select('.intro-models-normal'),
      ariaLabel: 'Two diagrams side by side both displaying another set of 50 images. On the left, we can see the predictions for Model A, which are all correct. On the right, we can see the predictions for Model B, which only classifies correctly 27/50 images. Almost all cat images get missclassified.',
    },
    {
      sel: d3.select('.intro-watermark'),
      ariaLabel: `A row of four images showing examples of images from the first set of images: two cats and two dogs. The cat images have a "SPCA" watermark on the bottom left corner. The dog images don't have any watermark.`,
    },
    {
      sel: d3.select('.occlusion-manual'),
      ariaLabel: `An image of a cat or a dog -it's possible to select the image from a set of images- over which a grid is drawn. Hovering over one box of the grid blacks out the cell. Blacking out the box that contains the watermark changes the prediction for Model B from cat to dog.`,
    },
    {
      sel: d3.select('.occlusion-auto .main-container'),
      ariaLabel: `Two animated diagrams for the Normal and the Watermark Model, in which each box of the grid gets checked one by one. After it's checked, each box is filled with a color corresponding to the class that the model predicts when the box is occluded. For the Watermark Model, the watermark area gets a different color, showing that "removing" it makes the prediction switch.`
    },
    // {
    //   sel: d3.select('.illustration-line'),
    //   ariaLabel: `Diagram showing how passing each user model through a secure aggregation step first prevents the central server know about a particular user's messages`,
    // },
    // {
    //   sel: d3.select('.cat-smiley'),
    //   ariaLabel: 'An image of a cat face in pixel art. In each pixel box, there is either an up or down arrow, with various sizes. Large arrows are the "salient" pixels' represented in white in saliency maps.'
    // },
    {
      sel: d3.select('.gradients-vanilla'),
      ariaLabel: `A row of three images showing a raw image of a cat, the corresponding vanilla gradient maps for the Normal Model and for the Watermark model. The saliency maps for Watermark Model highlight the watermark area.`,
    },
    {
      sel: d3.select('.quadrants-intro'),
      ariaLabel: 'A diagram divided in four quadrants: shows saliency maps for the watermark Model for cats with watermarks in the top left, dogs with watermarks in top right, cats without watermarks in bottom left and dogs without watermarks in bottom right. Possible to switch between raw images, Vanilla Gradients and gradients squared. Gradient Squared better highlights the watermark region for watermark-free images.',
    },
    {
      sel: d3.select('.quadrants-fifty'),
      ariaLabel: 'The same diagram divided in four quadrants but this time for a model trained on a dataset where 50% of cat images are watermarked. The model makes less mistakes than the Watermark Model, but still misclassifies many images.',
    },
    {
      sel: d3.select('.quadrants-eval-0'),
      ariaLabel: 'A diagram divided in four quadrants corresponding to the four categories of images. In each quadrant, a beeswarm diagram with 75 dots representing the saliency maps for the Normal Model for 75 different images are placed on scale showing the proportion of salient pixels in the watermark area. 0% of the salient pixels are in the watermark area.',
      isFullPlayground: true,
    },
    {
      sel: d3.select('.quadrants-eval-100'),
      ariaLabel: "Another diagram displaying the 4 beeswarm graphs for each category of images, this time for the Watermark Model. The watermak is well highlighted for images with watermarks. The watermark is highlighted a little less clearly for watermark-free images.",
      isFullPlayground: true,
    },
    {
      sel: d3.select('.quadrants-eval-50'),
      ariaLabel: 'Another diagram displaying the 4 beeswarm graphs for each category of images, this time for model trained on a dataset where 50% of cat images are watermarked. The spurious correlation gets even harder to detect.',
      isFullPlayground: true,
    },
    {
      sel: d3.select('.other-cheats'),
      ariaLabel: 'A matrix of four by four images. In the first column, input images of cats and dogs. In the 2nd, 3rd, 4th column, saliency maps for three different "mystery models". By looking at the saliency maps, it is not obvious to guess which spurious correlation the different models may have.',
      isFullPlayground: true,
    },
  ]


  graphics.measure = function(d){
    
    d.sel.at({role: 'graphics-document', 'aria-label': d.ariaLabel})
    if (!d.sel.node()) return
    d.width = d.sel.node().clientWidth
    d.height = d.sel.node().clientHeight
  }
  graphics.forEach(graphics.measure)


  graphics.rescale = function(){
    return
    graphics.forEach(d => {
      var scale = d3.clamp(0, (window.outerWidth - 10)/d.width, 1)

      d.sel.st({
        transform: `scale(${scale})`,
        transformOrigin: 'left top',
        height: d.height*scale,
      })
    })
  }
  graphics.rescale()

  d3.select(window).on('resize', _.debounce(graphics.rescale, 200))
  d3.select(window).on('focus', () => {
    // graphics.rescale()
    setTimeout(() => {
      d3.text('mobile-scale.js', (err, str) => {
        eval(str)
      })
    }, 200)
  })
}
window.initMobileScaling()






