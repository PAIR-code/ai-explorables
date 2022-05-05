---
permalink: /dataset-worldviews/
template: post.html

title: Datasets Have Worldviews
summary: Every dataset communicates a different perspective. When you shift your perspective, your conclusions can shift, too.
summaryalt: Every dataset communicates a different perspective. When you shift your perspective, your conclusions can shift, too.
shareimg: https://pair.withgoogle.com/explorables/images/dataset-worldviews-shareimg.png
date: 2022-01-28
---


<p>Suppose you have a dataset of shapes. They can either be <span class="monospace shaded">shaded</span> or <span class="monospace not-shaded">unshaded</span>. They look something like this:</p>

<div class='show-shapes'></div>

<p> You built a supervised <a href="https://developers.google.com/machine-learning/glossary#machine-learning" target="_blank">machine learning classifier</a> that will automatically classify each shape as <span class="monospace shaded">shaded</span> or <span class="monospace not-shaded">unshaded</span>. You call it the "Is-Shaded Classifier".</p>

<p>Click "Run Classifier" to see how your model performs.</p>
<br><br>
<center><div class='default-classifier-button'></div></center>
<div class='default-classifier'></div>
<div class='default-classifier-summary'></div>

<p>It’s not perfect— some of the shapes are definitely misclassified. You want to improve your model! </p>

<p> To do so, you want to know more about the <span class="emphasis"> kinds of mistakes your model is making</span>. </p>

<h3 id="classification-thinking">Thinking About Bias</h3>

<p>In training, you only gave your model the raw image of each shape and one <a href="https://developers.google.com/machine-learning/glossary#ground-truth" target="_blank">ground truth label</a>: <span class="monospace shaded">shaded</span> and <span class="monospace not-shaded">unshaded</span>. But maybe something about your model—the distribution of the training data you used, the architecture you chose, or how you set your hyperparameters—resulted in your model performing better on some shapes than others.</p>

<p> In fact, you’ve seen a lot of papers and articles citing issues of <span class="emphasis">biased model performance between circles, triangles, and rectangles</span> in shape data. One paper finds that shape detection algorithms tend to do worse on triangles; another article says color accuracy is an issue with circles. So you wonder: <span class="emphasis">are there biases in <i>your</i> model’s misclassifications?</span> </p>

<center><img src="img/newspapers_01.png" class="newspaper-image" alt="Three abstract drawings of papers or articles with headlines 'Shape detection: biased against triangles?', 'Geometry experts call for more accurate rectangle data, cite fairness concerns', and 'Increasing color accuracy in circles'" srcset="img/newspapers_01.svg"></center>

<p> You want to make sure that your model is performing equally well across circles, triangles, and rectangles, so you decide to do a fairness analysis.</p>

<p> There’s just one issue: <span class="emphasis"> you don’t have labels for which of your shapes are circles, triangles, or rectangles.</span> </p>

<p> So, you decide to send your data to <a href="https://developers.google.com/machine-learning/glossary#rater" target="_blank">data labelers</a>.</p>

<center><img src="img/data_labelers.png" srcset="img/data_labelers.svg" alt="Different shapes with an arrow pointing to a group of abstract people."></center>

<p> You receive feedback from your data labeling team that they’re not sure what to do with the shapes that aren’t exactly circles, triangles, or rectangles. </p>

<center><img src="img/confusing_shape_name.png" srcset="img/confusing_shape_name.svg" class="interface-image" alt="An image of a computer interface and the instructions 'Please select the name of the shape below'. There is a lumpy, blob-like shape with three checkboxes that say 'circle', 'triangle', and 'rectangle'. There is a text box with a question mark next to the interface."></center> 

<p> For the shapes that are unclear, you can have them use their best guess or simply label them as “other”. Then, you can finally do some fairness analysis! </p>

<p> Below is the interface they see: </p>

<center><div class="second-interface"></div></center>

<p> These shapes should be labeled... <select id='second-classifier-select-rounding'></select> </p>
<br>

<div class='second-classifier'></div>

<div class='second-classifier-summary'></div>

<p>If you go back and change the labelers' instructions, which shapes do you perform worst on? Where do you find bias?</p>

<p>You notice that <span class="emphasis">your results hinge on how you choose to classify the shapes in our data</span>.</p>

<p>Because ultimately, this <i>isn’t</i> a world of only circles, triangles, and rectangles!</p>

<h3 id="classification-thinking">Thinking About Classification</h3>

<p>What could we find out about our classifier's performance if we used different categories altogether?</p>

<p> All shapes are basically... <select id='final-classifier-select-category'></select> </p>
<p> Everything else should be labeled... <select id='final-classifier-select-rounding'></select> </p>

<p><div class='final-classifier'></div></p>
<p>
  <div class='final-classifier-summary'></div>
</p>

<p>With each of the different categories, which shapes do you perform worst on? Where do you find bias?</p>

<p>Each way of categorizing your shapes <span class="emphasis"> takes a different stance about what’s important </span>. Each one makes some features more important than others, it make some distinctions visible and other distinctions invisible, and make some things easy to classify while others become outliers.</p>

<p>And each one <span class="emphasis">tells you something different</span> about what kind of bias your classifier has!</p>

<h3 id="">Grouping and Regrouping</h3>

<p> Here's another way to look at the same results. We can draw all the shapes that were correctly classified above the dashed line, and all the incorrectly classified shapes below it. </p>

<div class='shape-explainer'></div>

<p> We're still looking at the same model making the same classification on the same shapes, so the same shapes stay above and below the line. But each way of grouping the results distributes the errors differently— each way <span class="emphasis"> tells you something different</span>.</p>

<h3 id="">Labels Tell Stories</h3>

<p>The decisions you make about classification, however small…</p>

<p><center> All shapes are basically... <select id='conclusion-select-category'></select> </center></p>

<p>…begin to shape others’ decisions…</p>

<center> <div class='conclusion-interface'></div></center>

<p>…they shape the analysis you can do…</p>

<center> <div class='conclusion-summary'></div></center>

<p>…and they shape the kinds of conversations that happen.</p>

<p><b><center><div class='conclusion-newspapers'></div></center></b></p>

<p>It’s natural to want to find a way out of this problem by gathering more features or collecting more data. If we just have enough detail on enough data, surely we can avoid making these kinds of decisions, right?</p>

<p>Unfortunately, that isn’t the case. Describing the world around us in any way—whether we’re telling a friend a story or telling a computer about shapes—requires us to choose <span class="emphasis">what information is important to convey and what tools we want to use to convey it.</span></p>

<p>Whether we think about it or not, we’re <i>always</i> making choices about classification.
</p>

<p><div class='fake-dropdown'><center>All people are basically... <span class='dropdown'>men or women</span></center></div></p>
<p><div class='fake-dropdown'><center>All food is basically... <span class='dropdown'>sweet or savory</span></center></div></p>
<p><div class='fake-dropdown'><center>All content is basically... <span class='dropdown'>kid-friendly or adult</span></center></div></p>
<p><div class='fake-dropdown'><center>All speech is basically... <span class='dropdown'>hate speech or acceptable speech</span></center></div></p>
<!-- <p><div class='fake-dropdown'><center>All results are basically... <span class='dropdown'> <span style="font-family:'Courier New'">p<0.05</span> and <span style="font-family:'Courier New'">p>0.05</span></span></center></div></p> -->
  <p><div class='fake-dropdown'><center>All results are basically... <span class='dropdown'> significant or insignificant</center></div></p>

<p>And as we saw with shapes, all of these choices <span class="emphasis">make some features more important than others</span>, make <span class="emphasis">some distinctions visible and other distinctions invisible</span>, and make <span class="emphasis">some things easy to classify while others become outliers</span>.</p>

<h3 id="classification-thinking">In Practice</h3>

<p>Let’s take a closer look at how this plays out in real machine learning applications. One straightforward example is in <a href="https://en.wikipedia.org/wiki/Object_detection" target="_blank">supervised object detection tasks</a>.</p>


<p>For example, let’s imagine we want to train an object detection model on a dataset including this image:</p>

<p><center><img src="img/seattle.png" width=700 alt="Image of the Seattle skyline" ><br> <a href="https://commons.wikimedia.org/wiki/File:Seattle_Kerry_Park_Skyline.jpg" target="_blank" class="source" >Source: Wikimedia Commons</a></center></p>

<p>We could give it the following ground truth <a href="https://developers.google.com/machine-learning/glossary#bounding-box" target="_blank">bounding boxes</a>:</p>

<p><center><img src="img/seattle_first_tags.png" srcset="img/seattle_first_tags.svg" width=700 alt="Image of the Seattle skyline with boxes around several items in the picture with labels like 'building' and 'tree'." ></center></p>

<p>This looks objective, right? After all, a building is a building, a bush is a bush, and a mountain is a mountain!</p>
<p> But even labeling the same regions in the same image, you can communicate a very different perspective:</p>

<p><center><img src="img/seattle_second_tags.png" srcset="img/seattle_second_tags.svg" width=700 alt="Image of the Seattle skyline with boxes around several items in the picture, with labels like 'plant, non medicinal' and 'structure, nonreligious'." ></center></p>

<p>Or consider the image below, with several sets of “ground truth” labels. Looking at each of these labels, consider:</p>

<p>What features matter? What gets labeled? Whose worldview comes through? What might you learn from this set of labels that you wouldn't learn from another?</p>

<div class='person-photos'></div><center><a href="https://commons.wikimedia.org/wiki/File:Women_washing_clothes_4.jpg" target="_blank" class="source">Source: Wikimedia Commons</a></center>

<p>There is no “view from nowhere”, no universal way to organize every object, or word, or image. Datasets are always products of a particular time, place, and set of conditions; they are socially situated artifacts. They have <a href="https://journals.sagepub.com/doi/full/10.1177/20539517211035955" target="_blank">histories</a>; they have <a href="https://arxiv.org/abs/2108.04308" target="_blank">politics</a>. And ignoring this fact has <a href="https://arxiv.org/pdf/2012.05345.pdf" target="_blank">very real consequences</a>.</p>

<p>So what do we do with this information?</p>

<p>A great place to start is to reflect on your own context and <a href="https://pair-code.github.io/datacardsplaybook/playbook" target="_blank">get curious about your data.</a> </p>

<p>If it’s hard to see a dataset’s values—if it feels “objective”, “universal”, or “neutral”—it may simply be reflecting a worldview you’re accustomed to. So, understanding the limitations of your own worldview can tell you about the limitations of “objective” data. What assumptions do you make about the world? What feels like common sense? What feels foreign?</p>

<p>And do some sleuthing about your data! Who collected this data? Why was it collected? Who paid for it? Where did the “ground truth” come from? </p>

<p>You might even find yourself <a href="https://www.morgan-klaus.com/pdfs/pubs/Scheuerman-CSCW2021-datapolitics.pdf" target="_blank">questioning what kinds of assumptions underpin machine learning dataset development</a> or even <a href="https://mitpress.mit.edu/books/sorting-things-out" target="_blank"> thinking more deeply about classification as a whole</a>.</p>

<p>If you find yourself with lots of questions, you're already off to a good start.</p>

<p></p>
<p></p>

<h3 id="credits">Credits</h3>

<p> Dylan Baker // January 2022</p>
<p> Thanks to Adam Pearce, Alex Hanna, Emily Denton, Fernanda Viégas, Kevin Robinson, Nithum Thain, Razvan Amironesei, and Vinodkumar Prabhakaran for their help with this piece. </p>
<p></p>


<div class='preload-dropdown-img' style='display: none;'></div>


<p id='feedback-form'></p>

<h3>More Explorables</h3>

<p id='recirc'></p>


<p><link rel="stylesheet" href="style.css"></p>
<script src='../third_party/d3_.js'></script>
<script src='../third_party/d3-scale-chromatic.v1.min.js'></script>
<script src='../third_party/params.js'></script>

<script src='shape-params.js'></script>
<script src='shapes.js'></script>
<script src='shape-explainer.js'></script>
<script src='script.js'></script>
<script src='person-photos.js'></script>

<script src='../third_party/recirc.js'></script>


