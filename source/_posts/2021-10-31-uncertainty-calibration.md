---
template: post.html
title: Are Model Predictions Probabilities?
socialsummary: Machine learning models express their uncertainty as model scores, but through calibration we can transform these scores into probabilities for more effective decision making.
shareimg: https://pair.withgoogle.com/explorables/images/uncertainty-calibration.png
shareimgabstract: https://pair.withgoogle.com/explorables/images/uncertainty-calibration-abstract.png
permalink: /uncertainty-calibration/
---

<div id='container'>
<div id='graph'></div>
<div id='sections'>

<div>

If a machine learning model tells you that it’s going to rain tomorrow with a score of 0.60, should you buy an umbrella?<a class='footstart'>1</a> 

<p> In the diagram, we have a hypothetical machine learning classifier for predicting rainy days. For each date, the classifier reads in relevant signals like temperature and humidity and spits out a number between 0 and 1. Each data point represents a different day, with the position representing the model’s prediction for rain that day and the symbol (🌧️ or ☀️) representing the true weather that occurred that day. 

<p> <div id='card'> Do the model’s predictions tell us the probability of rain?</div>

<p> In general, machine learning classifiers don’t just give binary predictions, but instead provide some numerical value between 0 and 1 for their predictions. This number, sometimes called the *model score* or *confidence*, is a way for the model to express their certainty about what class the input data belongs to. In most applications, the exact score is ignored and we use a threshold to round the score to a binary answer, yes or no, rain or not. However, by using *calibration* we can transform these scores into probabilities and use them more effectively in decision making.

</div>

<div> <h3>Thresholding</h3>

<p> One traditional approach to using a model’s score is through <span class='highlight'>*thresholding*</span>. In this setting, you choose a threshold *t* and then declare that the model thinks it’s going to rain if the score is above *t* and it’s not if the score is below, thereby converting the score to a binary outcome. When you observe the actual weather, you know how often it was wrong and can compute key aggregate statistics like <a href="https://en.wikipedia.org/wiki/Accuracy_and_precision#In_binary_classification" target="_blank">*accuracy*</a>.

<p> We can sometimes treat these aggregate statistics themselves as probabilities. For example, accuracy is the probability that the binary prediction of your model (rain or not) is equal to the ground truth (🌧️ or ☀️). 
</div>

<div> <h3>Adjustable Thresholding</h3>

<p>The threshold can easily be changed after the model is trained.

<p> Thresholding uses the model’s score to make a decision, but fails to consider the model’s confidence. The model score is only used to decide whether you are above or below the threshold, but the magnitude of the difference isn’t considered. For example, if you threshold at 0.4, the model’s predictions of 0.6 and 0.9 are treated the same, even though the model is much more confident in the latter.
 
<div id='card'> Can we do a better job of incorporating the model score into our understanding of the model? </div>

</div>

<div> <h3>Calibration</h3>

<p> <span class='highlight'>*Calibration*</span> lets us compare our model scores directly to probabilities. 

<p> For this technique, instead of one threshold, we have many, which we use to split the predictions into buckets. Again, once we observe the ground truth, we can see what proportion of the predictions in each bucket were rainy days (🌧️). This proportion is the *empirical probability* of rain for that bucket.

<p> Ideally, we want this proportion to be higher for higher buckets, so that the probability is roughly in line with the average prediction for that bucket. We call the difference between the proportion and the predicted rates the calibration error, and by averaging over all of the buckets, we can calculate the <a href="https://arxiv.org/pdf/1706.04599.pdf" target="_blank">Expected Calibration Error</a>. If the proportions and the predictions line up for our use case, meaning the error is low, then we say the model is “well-calibrated” and we can consider treating the model score as the probability that it will actually rain.
</div>

<div> <h3>Adjusting Calibration</h3>

<p> We saw above that a well-calibrated model allows us to treat our model score as a kind of probability. But if we start with a poorly calibrated model, one which is over or under-confident. Is there anything we can do to improve it?

<p> It turns out that, in many settings, we can adjust the model score without really changing the model’s decisions, as long as our adjustment preserves the order of the scores<a class='footstart'>2</a>. For example, if we map all of the scores from our original model to their squares, we don’t change the order of the data with respect to the model score. Thus, quantities like accuracy will stay the same as long as we appropriately map the threshold to its square as well. However, these adjustments *do* change the calibration of a model by changing which data points lie in which buckets.

<div id='card'> **Try** **tweaking the thresholds** to *calibrate* the model scores for our data<a class='footstart'>3</a> – how much can you improve the model's calibration? </div>

<p> In general, we don’t have to rely on tweaking the model scores by hand to improve calibration. If we are trying to calibrate the model for a particular data distribution, we can use mathematical techniques like <a href="https://en.wikipedia.org/wiki/Isotonic_regression" target="_blank">Isotonic Regression</a> or <a href="https://en.wikipedia.org/wiki/Platt_scaling" target="_blank">Platt Scaling</a> to generate the correct remapping for model scores.
</div>

<div> <h3>Shifting Data</h3>

<p> While good calibration is an important property for a model’s scores to be interpreted as probabilities, it alone does not capture all aspects of model uncertainty.

<p> What happens if it starts to rain less frequently after we've trained and calibrated our model? Notice how the calibration drops, even if we use the same calibrated model scores as before.

<p> Models are usually only well calibrated with respect to certain data distributions. If the data changes significantly between training and serving time, our models might cease to be well calibrated and we can’t rely on using our model scores as probabilities.
</div>

<div><h3>Beyond Calibration</h3>

<p> Calibration can sometimes be easy to game. For example, if we knew that it rains 50% of the time over the course of the year, then we could create a model with a constant prediction of 0.5 every day. This would have perfect calibration, despite not being a very useful model for distinguishing day-to-day differences in the probability of rain. This highlights an important issue: 

<div id='card'> Better calibration doesn’t mean more accurate predictions. </div> 

<p> It turns out that statisticians identified the issue with focusing solely on calibration in meteorology when comparing weather forecasts, and came up with a solution.  <a href="https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf" target="_blank">Proper scoring rules</a>  provide an alternative approach to measuring the quality of probabilistic forecasts, by using a formula to measure the distance between the model’s predictions and the true event probabilities. These rules guarantee that a better value must mean a better prediction in terms of accuracy and calibration. Such rules incentivize models to be both better calibrated and more accurate.  

</div>
</div>
</div>


<h3> More Reading </h3>

<p> This post is only the beginning of the discussion on the connections between machine learning models, probability, and uncertainty. In practice, when developing machine learning models with uncertainty in mind, we may need to go beyond calibration. 

<p> In some settings, errors are not all equal. For example, if we are training a classifier to predict if a patient needs to be tested for a disease, then a false negative (missing a case of the disease) may be <a href="https://pair.withgoogle.com/explorables/measuring-fairness/" target="_blank">more detrimental</a> than a false positive (accidentally having a patient tested). In such cases, we may not want a perfectly calibrated model, but may want to skew the model scores towards one class or another. The field of <a href="https://books.google.ca/books?hl=en&lr=&id=1CDaBwAAQBAJ&oi=fnd&pg=PA1&dq=Statistical+Decision+Theory&ots=LMuipfYL0J&sig=bSdHt0_Phot_wxieYXN7cvXvmII#v=onepage&q=Statistical%20Decision%20Theory&f=false" target="_blank">Statistical Decision Theory</a> provides us with tools to determine how to better use model scores in this more general setting. Calibration may also lead to tension with other important goals like <a href="https://proceedings.neurips.cc/paper/2017/file/b8b9c74ac526fffbeb2d39ab038d1cd7-Paper.pdf" target="_blank">model fairness</a> in some applications.

<p> Beyond this, so far we’ve only considered the case of using a single model score, i.e. a point estimate. If we trained the model a thousand times with different random seeds, or resampled the training data, we would almost certainly generate a collection of different model scores for a given input. To truly unpack the different sources of uncertainty that we might encounter, we might want to look towards *distributional* approaches to measuring uncertainty, using techniques like <a href="https://proceedings.neurips.cc/paper/2017/file/9ef2ed4b7fd2c810847ffa5fa85bce38-Paper.pdf" target="_blank">Deep Ensembles</a> or <a href="https://authors.library.caltech.edu/13793/1/MACnc92b.pdf" target="_blank">Bayesian modeling</a>. We will dig deeper into these in future posts.

<h3> Credits </h3>

<p> Nithum Thain, Adam Pearce, Jasper Snoek & Mahima Pushkarna // March 2022

<p> Thanks to Balaji Lakshminarayanan, Emily Reif, Lucas Dixon, Martin Wattenberg, Fernanda Viégas, Ian Kivlichan, Nicole Mitchell, and Meredith Morris for their help with this piece.

<h3> Footnotes </h3>

<p> <a class='footend'></a> Your decision might depend both on the probability of rain and its severity (i.e. how much rain there is going to be). We’ll focus just on the probability for now.

<p> <a class='footend'></a> Applying a strictly <a href="https://en.wikipedia.org/wiki/Monotonic_function" target="_blank">monotonic function</a> to the model always keeps the order of scores the same. 
 
<p> <a class='footend'></a> In this example, we adjust the model scores by changing the model scores of elements within a bucket to the mean of the bucket.  
<h3> More Explorables </h3>

<p id='recirc'></p>





<link rel="stylesheet" href="graph-scroll.css">
<script src='../third_party/d3_.js'></script>

<link rel='stylesheet' href='footnote.css'>
<script src='footnote.js'></script>

<script src='generate_data.js'></script>

<script src='util.js'></script>
<script src='weatherdata.js'></script>
<script src='draw_calibrationcurve.js'></script>
<script src='draw_model_remapping.js'></script>
<script src='draw_weathergraph.js'></script>
<script src='draw_slides.js'></script>
<script src='init.js'></script>

<script src='../third_party/recirc.js'></script>
<link rel="stylesheet" href="style.css">