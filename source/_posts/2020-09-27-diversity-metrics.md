---
template: post.html
title: Measuring Diversity
titlex: Diversity and Inclusion Metrics
summary: Search results that reflect historic inequities can amplify stereotypes and perpetuate under-representation. Carefully measuring diversity in data sets can help.
shareimg: https://pair.withgoogle.com/explorables/images/measuring-diversity.png
permalink: /measuring-diversity/
date: 2021-03-01
---

<link rel="stylesheet" href="style.css">

Search, ranking and recommendation systems can help find useful documents in large datasets. However, these datasets reflect the biases of the society in which they were created and the systems risk re-entrenching those biases. For example, if someone who is not a white man searches for "CEO pictures" and sees a [page of white men](https://www.nytimes.com/interactive/2018/04/24/upshot/women-and-men-named-john.html), they may feel that only white men can be CEOs, further perpetuating lack of representation at companies' executive levels. 

Using the careful quantification outlined in a recent paper, [Diversity and Inclusion Metrics in Subset Selection](https://arxiv.org/pdf/2002.03256.pdf), we can quantify biases and push these systems to return a wider range of results. 

The mathematics of all this is a little easier to follow with abstract shapes. Let's take a look at some of them:

<div id='all-shapes' class='shapes'></div>

Suppose we want to return about <b>30% green boxes</b> to reflect the distribution of some larger universe of shapes. Try clicking on the shapes below to select some of them — can you find a better subset to return?

<div id='pick-green' class='shapes'></div>

Another diversity metric we care about is the percentage of dots... how close to <b>35% dots</b> can you get?

<div id='pick-triangle' class='shapes'></div>

If we can only return a single subset, how should we consider multiple diversity metrics? Sometimes it isn't possible to reduce the difference of every metric to zero. One natural approach: find the selection with the **lowest mean difference** across all the metrics to get as close as possible to all the targets. 

In other circumstances, like picking a panel of speakers, avoiding badly representing any single category might be more important. This can be done by finding the subset with the **lowest max difference**. Try minimizing both below:  

<div id='pick-metric' class='shapes' style='margin-bottom: 0px'></div>

Notice that minimizing the mean results in a different subset than minimizing the max; how else might using one over the other change the results?   

### Ranking Measures

We can pull out more detail by showing how the mean difference and maximum difference rank lots of sets. Below, there are 20 sets of 10 shapes sorted by the two measures. Try adjusting the target slider on the left to see how the rankings change; each set's percentage of green, dots and small shapes are shown in the small histograms.  

<div id='columns-height'></div>

At the extremes, the choice of measure can have a big impact: if we want to try and return all green results, we can shift the green target up to 100%. With this target, the minimum difference basically sorts the sets by the number of green items and uses the other targets as a tiebreaker. In contrast, sorting by the mean difference balances the green target more with the dot and small targets.

<div id='columns-height-disagree'></div>

Beyond mean and max differences, there are more ways to combine diversity metrics, like taking the cross of two metrics to account for [intersectionality](https://en.wikipedia.org/wiki/Intersectionality). The absolute value of the difference in target and actual percentages can also be quantified in other ways — you might want to penalize undershooting more than overshooting, for example. It's important to keep in mind what exactly you're trying to maximize and the dataset that you're operating on.
 
### Which Measure is Best?

In a vacuum, all of these ranking methods are defensible. Picking one requires knowledge of the dataset and broader societal context.

For example, the doctors on the left have more variance along the shirt color attribute, but they're less diverse by gender than the doctors on the right. With the shirt color and gender targets we've picked, the two subsets have the same mean and max differences However, in most applications, it's more important to have a representative sample of socially relevant characteristics, like gender, rather than something less salient, like clothing color. 

<div id='coat-v-gender'></div>   

Just selecting a diverse sample isn't sufficient either. [Diversity and Inclusion Metrics in Subset Selection](https://arxiv.org/pdf/2002.03256.pdf) introduces a way of measuring "inclusion" - how well does the searcher feel represented in the results?

Below, we have gender diversity, without inclusion for women, in the “construction worker” image domain. Masculine-presenting individuals are shown in realistic, modern construction worker situations, while feminine-presenting individuals and other gender presentations are depicted as historic nostalgia, toys, clipart, or passive.

<div id='construction'></div>

The context of the query and the searcher also plays in the quality of search results. A search for "work clothing" that shows a mixed palette of colors for men's clothing and only pink women's clothing might make the searcher feel that women need to appear stereotypically feminine in a professional setting. But the same set of women's clothes might be appropriate to show for a "pink women work clothes" search or if the searcher had previously expressed a preference for pink.

We saw how a small switch from mean to max made a huge difference in what abstract shapes are returned – and how things can get even more complex when socially salient characteristics are layered in. Defaults and small decisions can encode our priorities and values; intentionally thinking about how diversity and inclusion are being measured and which characteristics are emphasized is a step towards designing more equitable systems.    

### More Reading

The [Diversity and Inclusion Metrics](https://arxiv.org/pdf/2002.03256.pdf) paper has a [Colab](https://colab.research.google.com/github/PAIR-code/ai-explorables/blob/master/source/measuring-diversity/diversity-and-inclusion.ipynb) with a detailed desciption of the metrics, additional visualizations and a reference Python implementation.  

The difficulties of [measuring fairness](https://pair.withgoogle.com/explorables/measuring-fairness/) in general have been well studied; subset selection is still an active area of research. [Fairness of Exposure in Rankings](https://www.cs.cornell.edu/~tj/publications/singh_joachims_18a.pdf) proposes a ranking algorithm that incorporates fairness constraints. [Toward creating a fairer ranking in search engine results](https://www.ilab.cs.rutgers.edu/~rg522/publication/gao-2020-ipm/gao-2020-ipm.pdf) measures diversity bias in actual search results. 

Inferring user preferences is also tricky; you can checkout ways to design for user feedback and control over queries in the [People + AI Guidebook](https://pair.withgoogle.com/chapter/feedback-controls/).

### Credits 

Adam Pearce, Dylan Baker, Ellen Jiang, Meg Mitchell\* and Timnit Gebru\* // March 2021

\*Work done while at Google

Thanks to Alex Hanna, Carey Radebaugh, Emily Denton, Fernanda Viégas, James Wexler, Jess Holbrook, Ludovic Peran, Martin Wattenberg, Michael Terry, Yannick Assogba and Zan Armstrong for their help with this piece.

<h3>More Explorables</h3>

<p id='recirc'></p>

<div class='recirc-feedback-form'></div>



<script src='../third_party/d3_.js'></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js">
</script>
<script src='sliders.js'></script>
<script src='script.js'></script>
<script src='image-layout.js'></script>

<script src='columns-height.js'></script>

<script src='../third_party/recirc.js'></script>