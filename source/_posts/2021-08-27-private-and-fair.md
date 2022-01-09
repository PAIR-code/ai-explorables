---
template: post.html
title: Can a Model Be Differentially Private and Fair?
summary: Training models with differential privacy stops models from inadvertently leaking sensitive data, but there's an unexpected side-effect: reduced accuracy on underrepresented subgroups. 
shareimg: https://pair.withgoogle.com/explorables/images/private-and-fair.png
permalink: /private-and-fair/
---

Imagine you want to use machine learning to suggest new bands to listen to. You could do this by having lots of people list their favorite bands and using them to train a model. The trained model might be quite useful and fun, but if someone pokes and prods at the model in just the right way, they could [extract](https://www.wired.com/2007/12/why-anonymous-data-sometimes-isnt/) the music preferences of someone whose data was used to train the model. Other kinds of models are potentially vulnerable; [credit card numbers](https://bair.berkeley.edu/blog/2019/08/13/memorization/) have been pulled out of language models and [actual faces](https://rist.tech.cornell.edu/papers/mi-ccs.pdf) reconstructed from image models.

Training with [differential privacy](https://desfontain.es/privacy/differential-privacy-awesomeness.html) limits the information about any one data point that is extractable but in some cases there's an unexpected side-effect: reduced accuracy with underrepresented subgroups disparately impacted.  

<div class='info-box'></div>

Recall that machine learning models are typically trained with [gradient descent](https://playground.tensorflow.org/), a series of small steps taken to minimize an error function. To show how a model can leak its training data, we've trained two simple models to separate red and blue dots using two simple datasets that differ in one way: a single isolated data point in the upper left has been switched from red to blue.  

<div class='epoch-graph'></div>

Notice that the two models have very different boundary lines near the isolated point by the end of the training. Someone with access to the trained model might be able to [infer](https://pair.withgoogle.com/explorables/data-leak/) if the point in the upper left is red or blue — if the color represented sensitive information, like someone's [voting record](https://gothamist.com/news/researchers-know-how-dante-de-blasio-hundreds-other-new-yorkers-voted), that could be quite bad! 

### Protecting the Privacy of Training Points 

We can prevent a single data point from drastically altering the model by [adding](http://www.cleverhans.io/privacy/2019/03/26/machine-learning-with-differential-privacy-in-tensorflow.html) two operations to each training step:<a class='footstart'>²</a>
- ⚬ Clipping the gradient (here, limiting how much the boundary line can move with each step) to bound the maximum impact a single data point can have on the final model.
- ⚬ Adding random noise to the gradient.

Try **increasing** the random noise below. We're now training lots of differentially private models; the more the potential models for the red and blue outlier points overlap, the more [plausible deniability](https://pair.withgoogle.com/explorables/anonymization/) the person in the upper left has.<a class='footstart'></a>  

<div class='decision-boundry'></div>  

You can also try dragging the other points around and adjusting the gradient clipping. Are points in the center or outliers more likely to modify the boundary lines? In two dimensions there's a limited number of outliers, but in higher dimensions [more points](https://observablehq.com/@tophtucker/theres-plenty-of-room-in-the-corners) are outliers and much more information can be extracted from a trained model.

Correctly combined, adding gradient clipping and random noise to gradient descent make it possible to train a model with [differential privacy](https://desfontain.es/privacy/differential-privacy-awesomeness.html) – we can guarantee that a model trained on a given dataset is essentially indistinguishable from a model trained on the same dataset with a single point changed.    
### Predictions on Outliers Change the Most   

What does this look like in practice? In [Distribution Density, Tails, and Outliers in Machine Learning](https://arxiv.org/abs/1910.13427), a series of increasingly differentially private models were trained on [MNIST digits](https://en.wikipedia.org/wiki/MNIST_database). Every digit in the training set was ranked according to the highest level of privacy that correctly classified it. 

<div class='top-bot-digits'></div>
 
On the lower left, you can see digits labeled as "3" in the training data that look more like a "2" and a "9". They're very different from the other "3"s in the training data so adding just a bit of privacy protection causes the model to no longer classify them as "3". Under some [specific circumstances](https://arxiv.org/abs/1411.2664), differential privacy can actually improve how well the model generalizes to data it wasn't trained on by limiting the influence of spurious examples.<a class='footstart'></a>

The right side shows more canonical digits which are classified correctly even with high levels of privacy because they're quite similar to other digits in the training data.<a class='footstart'></a>
### The Accuracy Tradeoff 
Limiting how much a model can learn from a single example does have a downside: it can also decrease the model's accuracy. With <tp class='tp75'>7,500 training points</tp>, 90% accuracy on MNIST digits is only [achievable](https://colab.research.google.com/github/PAIR-code/ai-explorables/blob/master/server-side/private-and-fair/MNIST_DP_Model_Grid.ipynb) with an extremely low level of privacy protection; increasing privacy quickly lowers the model's accuracy. 

Collecting more training data offers a way out of this accuracy/privacy tradeoff. With <tp class='tp60'>60,000 training points,</tp> 90% accuracy can be reached with a higher privacy level than almost all [real-world deployments](https://desfontain.es/privacy/real-world-differential-privacy.html) of differential privacy. 

<div class='accuracy-v-privacy-dataset_size'></div>

Looking at the differences between predictions by digit class shows another potential complication: some classes are harder to identify than others. Detecting an "8" with high confidence requires more training data and/or lower privacy than detecting a "0" with high confidence. 

<div class='accuracy-v-privacy-class'></div>

This problem is exacerbated if the training data has fewer examples of one class than the others. Trying to predict an uncommon event with a differentially private model can require an enormous amount of data.<a class='footstart'></a>

### Implications for Fairness

Outliers also aren't evenly distributed within a class. Below, MNIST digits are colored by their sensitivity to higher privacy levels and projected with [UMAP](https://pair-code.github.io/understanding-umap/), forming several clusters of privacy-sensitive yellow digits. It's possible to inadvertently train a model with good overall accuracy on a class but very low accuracy on a smaller group within the class. 

<div class='umap-digit'></div>

There's nothing that makes a "1" slanted to the left intrinsically harder to classify, but because there are only a few slanted "1"s in the training data it's difficult to make a model that classifies them accurately without leaking information. 

This disparate impact doesn't just happen in datasets of differently drawn digits: increased levels of differential privacy in a range of image and language models [disproportionality decreased accuracy](https://arxiv.org/pdf/1905.12101.pdf) on underrepresented subgroups. And adding differential privacy to a medical model [reduced](https://arxiv.org/pdf/2010.06667v1.pdf) the influence of Black patients' data on the model while increasing the influence of white patients' data. 

Lowering the privacy level might not help non-majoritarian data points either – they're the ones most [susceptible](https://arxiv.org/abs/1906.00389) to having their information exposed. Again, escaping the accuracy/privacy tradeoff requires collecting more data – this time from underrepresented subgroups.<a class='footstart'></a>   
### More Reading

There are deep connections between [generalization, memorization and privacy](https://arxiv.org/abs/1906.05271) that are still not well understood. Slightly changing the privacy constraints, for example, can create new options. If public, unlabeled data exists, a "[Private Aggregation of Teacher Ensembles](http://www.cleverhans.io/privacy/2018/04/29/privacy-and-machine-learning.html)" could be used instead of gradient clipping and random noise to train a differentially private model with a [smaller disparate impact](https://arxiv.org/pdf/2106.12576.pdf) on accuracy. 

Finding ways to increase privacy with a smaller impact on accuracy is an active area of research – [model architectures](https://arxiv.org/abs/2007.14191) designed with privacy in mind and better [dataset cleaning](https://arxiv.org/pdf/2107.06499.pdf) look like promising avenues.  

There are also additional [accuracy/privacy/fairness](http://proceedings.mlr.press/v97/jagielski19a/jagielski19a.pdf) tradeoffs beyond what's discussed in this post. Even if a differentially private model doesn't have large accuracy gaps between subgroups, enforcing [fairness metrics](https://pair.withgoogle.com/explorables/measuring-fairness/) can reduce privacy or accuracy.

This post focuses on protecting the privacy of individual data points. In practice more work might be necessary to ensure that the [privacy of users](https://queue.acm.org/detail.cfm?id=3501293#:~:text=Computing%20and%20Verifying%20Anonymous%20Aggregates) – who could contribute much more than a single data point each – is also protected.    

These questions are also significant outside of machine learning. [Allocating resources](https://arxiv.org/abs/2105.07513) based on a differentially private dataset – with no machine learning model involved – can also disproportionately affect different groups. The 2020 Census is the first to use differential privacy and this could have a wide range of impacts, including how [congressional districts](https://statmodeling.stat.columbia.edu/2021/10/20/how-does-post-processed-differentially-private-census-data-affect-redistricting-how-concerned-should-we-be-about-gerrymandering-with-the-new-das/) are drawn. 

### Credits 

Adam Pearce // January 2022

Thanks to Abhradeep Thakurta, Andreas Terzis, Andy Coenen, Asma Ghandeharioun, Brendan McMahan, Ellen Jiang, Emily Reif, Fernanda Viégas, James Wexler, Kevin Robinson, Matthew Jagielski, Martin Wattenberg, Meredith Morris, Miguel Guevara, Nicolas Papernot and Nithum Thain for their help with this piece.

### Footnotes

<a class='footend'></a> To speed up training at the cost of looser privacy bounds, gradients, clipping and noise can be calculated on a group of data points instead of individual data points.   

<a class='footend'></a> The "ε" in ε-differential privacy essentially [measures](https://desfontain.es/privacy/differential-privacy-in-more-detail.html) the overlap in two distributions after changing a single data point. 

<a class='footend'></a> [Clipping](https://openreview.net/forum?id=BJgnXpVYwS) and [noising](https://arxiv.org/pdf/1511.06807.pdf) are also used outside of differential privacy as regularization techniques to improve accuracy. <br><br> In addition to accidently mislabeled examples, differential privacy can also provide some protection against [data poisoning attacks](https://dp-ml.github.io/2021-workshop-ICLR/files/23.pdf).  

<a class='footend'></a> While visually similar digits aren't necessarily interpreted in similar ways by the model, the clustering of visually similar digits in the UMAP diagram at the bottom of the page (which projects embedding from the penultimate layer of digit classifier) suggests there is a close connection here.   

<a class='footend'></a> Rebalancing the dataset without collecting more data doesn't avoid this privacy/accuracy tradeoff – upsampling the smaller class reduces privacy and downsampling the larger class reduces data and lowers accuracy.  

<a class='footend'></a> See the appendix on [Subgroup Size and Accuracy](#appendix-subgroup-size-and-accuracy) for more detail.   

### Appendix: Subgroup Size and Accuracy

How, exactly, does the amount of training data, the privacy level and the percentage of data from a subgroup impact accuracy? Using MNIST digits rotated 90° as a stand-in for a smaller subgroup, we can see how the accuracy of a series of simple [models](https://colab.research.google.com/github/PAIR-code/ai-explorables/blob/master/server-side/private-and-fair/MNIST_Generate_UMAP.ipynb) that classify "1"s and "7"s change based on these attributes. 

On the far left, models without any rotated digits in the training data never classify those digits more accurately than random guessing. By rotating 5% of the training digits, a small slice of models with lots of training data and low privacy can accurately classify rotated digits. 

<div class='rotated-accuracy-heatmap'></div>

Increasing the proportion of rotated digits to 10% or 20% or even more makes it possible to train a higher privacy model that performs well on both types of digits with the same amount of training data.  

Click on one of the models above and you can see how the accuracy gap shifts as number of training points, privacy level and percentage of rotated digits are independently changed.

<div class='rotated-accuracy'></div>

Intuitively, adding more training data has diminishing marginal increases to accuracy. Accuracy on the smaller group of rotated digits, which may just be on the cusp of being learned, falls off faster as the effective amount of training data is decreased — a disparate reduction in accuracy.


### More Explorables


<p id='recirc'></p>
<link rel="stylesheet" href="style.css">

<script type='module'>
  import npyjs from '../third_party/npyjs.js' 
  window.npyjs = npyjs
</script>
<script src='../third_party/d3_.js'></script>
<script src='../third_party/d3-scale-chromatic.v1.min.js'></script>
<script src='../third_party/alea.js'></script>


<script type='module' src='util.js'></script>

<script type='module' src='2d-privacy.js'></script>

<script type='module' src='top-bot-digits.js'></script>
<script type='module' src='accuracy-v-privacy-class.js'></script>
<script type='module' src='accuracy-v-privacy-dataset_size.js'></script>
<script type='module' src='umap-digit.js'></script>

<script type='module' src='rotated-accuracy.js'></script>


<script type='module' src='footnote.js'></script>
<script src='../third_party/recirc.js'></script>