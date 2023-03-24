---
template: post.html
title: From Confidently Incorrect Models to Humble Ensembles
socialsummary: ML models sometimes make confidently incorrect predictions when they encounter out of distribution data. Ensembles of models can make better predictions by averaging away mistakes.
shareimg: https://pair.withgoogle.com/explorables/images/uncertainty-ood.png
permalink: /uncertainty-ood/
date: 2023-03-24
---

When a machine learning model is trained, it learns patterns from data. When models are deployed in the real world, however, they often encounter data that is different in some way than the data they were trained on. In this Explorable, we'll examine how this phenomenon can cause models to misbehave and what can be done about it.

Let’s look at an example of an image classifier that is trained on <a href="https://en.wikipedia.org/wiki/MNIST_database" target="_blank">MNIST</a>, a dataset of hand-drawn digits. 

<div id='paint-container-iid'></div>

The model will update its predictions as you draw on it. Try changing the eight to zero or the seven to a nine. As you experiment with drawings, do you always agree with the model’s decisions? What do you think of the model’s predictions for transition images between one number and the next?


### Models Can Be Confidently Incorrect

Below, we expand the default set of images further to show what happens when the model is asked to classify something other than a number. As you click through the different images, you can see how the model's prediction changes over time as one image transforms into another.

<div id='paint-container-ood'></div>

A typical machine learning model, when faced with data it wasn’t trained on (called **out of distribution data**), will try to make predictions based on the data it initially saw. In this case, no matter what we draw, the classifier will try to tell us that it is a number. 

This is a consequence of the way that this (and indeed most) machine learning classifiers are designed, with a fixed set of classes in mind. The model is only able to choose which among these classes it thinks is more likely and assign a confidence score. To read more about how model confidence scores work and how they relate to probabilities, check out our previous Explorable <a href="https://pair.withgoogle.com/explorables/uncertainty-calibration/" target="_blank">Are Model Predictions Probabilities?</a>

For many practical applications, however, we don't want the model to report that a shoe is a "2" with 100% confidence. Instead, we might want the model to reduce the score that it assigns to data that is unlike anything it has been trained on. When a model incorrectly gives an out of distribution example a very high score, we call it **confidently incorrect**. 

### Combining Models Reduces Overconfidence

By averaging the output of multiple models, a technique known as **ensembling**, we can create a model that isn't as confidently incorrect. 

<div id='mnist-ensemble'></div> 

<a href="https://arxiv.org/abs/1612.01474" target="_blank">Deep Ensembles</a> train multiple models with different random initializations. The members of the ensemble learn to make different decisions and typically <a href="https://arxiv.org/abs/1912.02757" target="_blank">disagree</a> in their predictions on out-of-distribution inputs. While an individual network can be overconfident in its incorrect prediction, ensemble output averages the different predictions and is less confident overall on out-of-distribution inputs. 

There are generally no constraints on a model’s predictive behavior away from the training data, so different models will settle into making overconfident, but different, predictions on out of distribution data. This has the effect of lowering the overall confidence of the prediction by using the disagreement between the individual models’ predictions. 

### Why Do Ensembles Work?

To better understand why ensembles reduce the chance of being confidently incorrect, let’s explore what happens in the case of 2-dimensional classification. Below, we plot an ensemble classifier that is deciding whether a point in 2 dimensions should be red or blue. The color of the background indicates the decision made by the ensemble of models. 

<div id='ensemble-2d-linear'></div>

With just a <span class='button'>single model</span>, the decision boundary is very steep and the model is quick to make a confident decision even if the point is close to the decision boundary. As the number of models <span class='button'>grows</span>, the disagreement between them manifests as a widening of the decision boundary, especially further away from the training data. 

Not all models have simple linear decision boundaries. Below are models with piecewise linear decision boundaries (which are common in <a href="https://en.wikipedia.org/wiki/Rectifier_(neural_networks)" target="_blank">certain</a> machine learning models). As you can see, because these have even more degrees of freedom than simple linear decision boundaries, the uncertainty of an ensemble is even more pronounced further from the data.

<div id='ensemble-2d-piecewise'></div>

While ensembles increase uncertainty in a useful way, the way they do it is deeply dependent on model architecture. <span class='button'>Moving</span> a blue point to the lower right creates very different decision boundaries for the linear and piecewise linear models. 

### Beyond Ensembles

Ensembles are just one technique that can be used to improve the quality of a model’s uncertainty estimates. There are other methods that <a href="https://www.tensorflow.org/tutorials/understanding/sngp" target="_blank">aggregate</a> the predictions of a collection of models, but also strategies like <a href="https://arxiv.org/abs/2103.00020" target="_blank">incorporating lots more data</a>. Modern models are big, so keeping multiple models around for an ensemble can be a non-starter for many memory or latency-sensitive applications.  Therefore, a variety of factorized or efficient ensemble methods have been developed to create an ensemble <a href="https://arxiv.org/pdf/2002.06715.pdf" target="_blank">within</a> a single model.

You may have heard of Bayesian methods such as <a href="https://www.tensorflow.org/tutorials/understanding/sngp" target="_blank">Gaussian processes</a>, which use a carefully weighted average over all possible (infinitely many) models.  These methods are expensive as you might imagine, but the research community is actively developing clever approximations and ways of incorporating them into just parts of the overall model to make things more tractable.

Another good approach to improving uncertainty estimates on out of distribution data is to pre-train bigger models on <a href="https://proceedings.mlr.press/v162/fang22a/fang22a.pdf" target="_blank">more data</a>, in the hopes that this overall improves the quality of the representations and makes it easier to draw good decision boundaries.

<a href="https://ai.googleblog.com/2022/07/towards-reliability-in-deep-learning.html" target="_blank">Plex</a> explores a range of techniques to improve uncertainty in modern large text and vision models. At that scale, full ensembles are just too big, but they tried combinations of efficient ensembles, incorporating more data and approximate Bayesian methods. <a href="https://arxiv.org/abs/2205.00403" target="_blank">One of these strategies</a> is to change just the last layer of your neural network to a Gaussian Process. This kind of creates an infinite ensemble of just the last layer (making it tractable), but has an added benefit of allowing the decision boundaries of the classifier to much more directly take into account the distance between examples we are using and the training data. 

### Credits

Nithum Thain, Adam Pearce, Jasper Snoek and Balaji Lakshminarayanan // March 2023

Thanks to Nicole Mitchell, Lucas Dixon, and Alexander D'Amour for their help with this piece.

If you’d like to experiment with your own image classification models, check out our <a href="https://colab.research.google.com/github/PAIR-code/ai-explorables/blob/master/server-side/uncertainty-ood/mnist-tfjs.ipynb" target="_blank">model training colab</a>.
 
### More Explorables

<p id='recirc'></p>

<div class='recirc-feedback-form'></div>

<script type='module'>
  import npyjs from '../third_party/npyjs.js' 
  window.npyjs = npyjs
</script>

<link rel="stylesheet" href="style.css">
<script src='../third_party/d3_.js'></script>
t>
<script src='../third_party/d3-scale-chromatic.v1.min.js'></script>

<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.0/dist/tf.min.js"></script>

<script src='util.js'></script>
<script src='draw_canvas_image_picker.js'></script>
<script src='draw_canvas_mnist_single.js'></script>
<script src='draw_canvas_mnist_ensemble.js'></script>
<script src='draw_2d.js'></script>

<script src='init.js'></script>

<script src='../third_party/swoopy-drag.js'></script>

<script src='swoopy.js'></script>

<script src='../third_party/recirc.js'></script>