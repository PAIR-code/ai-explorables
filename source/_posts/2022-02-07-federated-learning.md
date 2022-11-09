---
template: post.html
title: How Federated Learning Protects Privacy
socialsummary: Most machine learning models are trained by collecting vast amounts of data on a central server. Federated learning makes it possible to train models without any user's raw data leaving their device.
shareimg: images/federated-learning.png
permalink: /federated-learning/
---

<div class='federate-playground playground-top'></div>

Large datasets have made astounding breakthroughs in machine learning possible. But oftentimes data is personal or proprietary, and not meant to be shared, making privacy a critical concern of and barrier to centralized data collection and model training. With [**federated learning**](http://ai.googleblog.com/2017/04/federated-learning-collaborative.html), it’s possible to collaboratively train a model with data from multiple users without any raw data leaving their devices. If we can learn from data across many sources without needing to own or collect it, imagine what opportunities that opens!

Billions of connected devices — like phones, watches, vehicles, cameras, thermostats, solar panels, telescopes — with sensors to capture data and computational power to participate in training, could collaborate to better understand our environment and ourselves. How do people move? What impacts our health and wellbeing? Together via federated learning these devices could enable new technologies as well. Consider how our cars might contribute to large-scale training of autonomous vehicles without divulging our whereabouts. 

And this machine learning approach can be applied across separate organizations as well. [Hospitals](https://www.nature.com/articles/s41551-022-00898-y) could design better treatment plans with knowledge about patient outcomes due to various interventions from care providers worldwide without sharing highly sensitive health data. [Pharmaceutical companies](https://www.melloddy.eu/) with proprietary drug development data could collaborate to build knowledge about how the body is likely to metabolize different compounds.

This framework has the potential to enable large-scale aggregation and modeling of complicated systems and processes like urban mobility, economic markets, energy use and generation patterns, climate change and public health concerns. Ultimately, the hope of federated learning is to allow people, companies, jurisdictions and institutions to collaboratively ask and answer big questions, while maintaining ownership of their personal data.

### Designing a Federated Learning System

Let’s explore how this technology works with a simple example we can all relate to: blocking spam messages. Spam in chat apps is annoying and pervasive. Machine learning offers a solution – we could develop a model that automatically filters out incoming spam based upon what users previously marked as spam on their devices. This sounds great, but there's a catch: most machine learning models are trained by collecting vast amounts of data on a central server; and user messages can be quite personal. To protect privacy, is it possible to train a spam detection model — or any machine learning model, for that matter — without sharing any potentially sensitive information with a central server?  

To answer this question, let's first take a closer look at a typical centralized training system, illustrated by the simple spam detection model below. User messages are uploaded to a central server, where they're processed all at once to train a [bag-of-words](https://en.wikipedia.org/wiki/Bag-of-words_model) model. Click a message to flag it as spam <span class='spam-icon'>❌</span> or not to change the data uploaded to the server and the trained model.

<div class='central-spam-model'></div> 

This model might be pretty good at filtering out spam messages. But centralized training comes with a big downside: all the messages, no matter how sensitive, need to be sent to the server, requiring users to trust the owners of that centralized server to protect their data and not misuse it.<a class='footstart'></a>   

What if training was done locally on each user’s device instead and their data wasn't centrally collected? Smartphones are getting increasingly powerful, and they’re often idle — for example, while charging overnight — enabling machine learning model training to run without impacting the user experience.
<div class='local-spam-model'></div>

Training models locally is great for privacy — no data ever leaves a user’s device! — but we can see here how a single device with limited data might not be able to train a high quality model. If a new [scam](https://www.fcc.gov/consumers/guides/beware-auto-warranty-scams) involving, say, car insurance starts spamming messages to everyone, Alice’s phone wouldn't be able to filter out messages about "your auto warranty renewal" with a local-only model until she marks several of them as spam — even if Bob has already flagged similar messages.

How can users help each other out and collaboratively train a model without sharing their private data? One idea is for users to share their locally trained spam-detection models instead of their messages. The server can then combine these models, for example by averaging them, to produce a global model that everyone could use for spam filtering.
 
<div class='federated-spam-model'></div> 

While we've stopped sending every raw message to the server, uploading these local models still leaks some information. Here, the central server has direct access to the rates each user marks different words as spam and can infer what they're talking about. Depending on the level of trust users have in the server, they may be uncomfortable with the server seeing their local models. Ideally the server should only see the aggregated result. We want to develop a system that provides as much [data minimization](https://queue.acm.org/detail.cfm?id=3501293#:~:text=The%20principle%20of,be%20discussed%20later.) as possible.

[**Federated learning**](https://ai.googleblog.com/2017/04/federated-learning-collaborative.html) is a general framework that leverages data minimization tactics to enable multiple entities to collaborate in solving a machine learning problem. Each entity keeps their raw data local, and improves a global model with focused updates intended for immediate aggregation. A good first step towards limiting data exposure when combining user models is to do so without ever storing the individual models — only the aggregate. [Secure aggregation](https://dl.acm.org/doi/10.1145/3133956.3133982) and [secure enclaves](https://queue.acm.org/detail.cfm?id=3501293#:~:text=For%20example%2C%20a%20server%20could%20run%20the%20aggregation%20procedure%20within%20a%20secure%20enclave) can provide even stronger guarantees, combining many local models into an aggregate without revealing the contribution of any user to the server. This may sound almost magical, so let's take a closer look at how secure aggregation works.

In the secure aggregation protocol, user devices agree on shared random numbers, teaming up to mask their local models in a way that preserves the aggregated result. The server won’t know how each user modified their model.

<div class='full-width'><div class='secure-aggregation'></div></div>

Try dragging the <hn class='green'>shared random numbers</hn> — the <total>aggregated sum</total> remains constant even though what each user sends to the server changes. And importantly, the users’ <hn>hidden numbers</hn> are never shared!<a class='footstart'></a>

Let’s put everything together by running all the user-contributed numbers that make up each of their local models through the secure aggregation process. Alice, Bob and Carol’s devices use a cryptographic [technique](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) to exchange random numbers secretly — our users won't actually meet in person. 

<div class='secure-federated-spam-model'></div>

With secure aggregation, users collaboratively merge their models without revealing any individual contribution to the central server.

All in all, federated learning enables collaborative model training, while minimizing data exposure. This system design extends to problem settings far beyond the toy spam example we’ve illustrated above, to larger-scale modeling across all sorts of devices and institutions with privately-held data.

### Training a Federated Model

While a very simple model like our toy spam classifier can be learned via a single round of merging local models, more sophisticated models require many iterations of local training and [federated averaging](https://arxiv.org/abs/1602.05629). Let’s see how that works and examine some challenges that arise in practice. We'll look at a simple "heat-map" [binary classification](https://towardsdatascience.com/binary-classification-and-logistic-regression-for-beginners-dd6213bf7162) model designed to guess what regions of a grid are likely to be <span class='hot'>hot</span> or <span class='cold'>cold</span>. Each of our users has only collected temperature readings from a handful of locations: 

<div class='data-map-users'></div>

If all the users uploaded their data to a central server, it'd be easy to spot the pattern:  

<div class='data-map-all-points'></div>

Our goal is to learn this temperature distribution across the grid — so everyone will know where they need a sweater! — without anyone having to share their location history.

Below, each user is continually training a model with just their local data, predicting the temperature of every location in the grid. You can see how dramatically different models are trained as each user's model overfits to their limited view of the world. The local training curves track the accuracy of each local model on the ground truth data, indicating how well each local model learns the true temperature distribution across the grid.<a class='footstart'></a>  

<div class='federate-playground playground-step'></div>

Click <merge-models-inline></merge-models-inline> to run a round of federated training: averaging user models and distributing the updated global model to all users.<a class='footstart'></a> After training and merging models several times, the resulting global model better resembles the overall temperature distribution across the map than the models trained on just local data. You may notice how local heat map models [drift](https://arxiv.org/abs/1910.06378) apart after a significant period of local training, and the latest global model’s accuracy might degrade upon merging. Relatively frequent periodic averaging is used to avoid this.<a class='footstart'></a>

While we plot the local model accuracies so it’s possible to observe these training dynamics, in practice a server running federated training only has access to the global model. The only metric that can be computed and tracked over the course of training by the server is the global model accuracy. 
### Outliers

This works pretty well when all users report consistent temperature experiences. What happens if that's not the case? Maybe some of our users have broken thermometers and report cold weather everywhere! Click on each of the four <span class='outlier'>outliers</span> to exclude them from training and notice how the model performs.<a class='footstart'></a>

<div class='federate-playground playground-outlier'></div>

We may be able to better train a model to predict the heat-map that the majority of users observed without the outliers, but what if these outlier users don’t have broken sensors and their data just looks different? Some people may have different ideas of what is “hot” or “cold;” excluding outliers from training risks [reducing accuracy for](https://arxiv.org/abs/1905.10497) groups of people less represented in the training pool.<a class='footstart'></a>    

Though it’s easy to spot the outliers in this example, in practice the server in a federated learning system cannot directly see user training data, which makes [detecting](https://arxiv.org/abs/2108.10241) outliers in federated learning tricky. The presence of outliers is often indicated by poor model quality across users. 
### Differential Privacy

Having the global model drastically change based on the presence of a single user also raises privacy concerns. If one user's participation can significantly affect the model, then someone observing the final model might be able to determine who participated in training, or even infer their local data. Outlier data is particularly likely to have a larger impact on model training.

For example, let’s say our potential user group includes one person known to always wear a sweater and complain about the cold. If the global model accuracy is lower than expected, we can infer that the notorious sweater-wearing user probably participated in training and reduced accuracy by always reporting cold. This is the case even with secure aggregation — the central server can't directly see which user contributed what, but the resulting global model still gives away that it's likely that a user who believes that it’s always sweater weather participated.<a class='footstart'></a>

Carefully bounding the impact of any possible user contribution and adding random noise to our system can help prevent this, making our training procedure [differentially private](https://desfontain.es/privacy/differential-privacy-in-more-detail.html). When using differential privacy in federated learning, the overall accuracy of the global model may degrade, but the outcome should remain roughly the same when toggling inclusion of the outlier (or any other user) in the training process.

Use the slider to modulate how much the user-reported locations are perturbed. At lower levels of privacy toggling the inclusion of the outlier affects the model more significantly, whereas at higher levels of privacy there is not a discernible difference in model quality when the outlier is included.

<div class='federate-playground playground-dp'></div>

In practice user models are [clipped](https://pair.withgoogle.com/explorables/private-and-fair/#:~:text=%E2%9A%AC%20Clipping%20the%20gradient) and [noised](https://pair.withgoogle.com/explorables/private-and-fair/#:~:text=%E2%9A%AC%20Adding%20random%20noise%20to%20the%20gradient.) rather than their raw data, or noise is applied to the combination of many clipped models. Applying the noise centrally tends to be better for model accuracy, however the un-noised models may need to be protected by technologies like [trusted aggregators](https://queue.acm.org/detail.cfm?id=3501293#:~:text=Computing%20and%20Verifying%20Anonymous%20Aggregates).

This demonstration illustrates a trade-off between privacy and accuracy, though there’s another missing dimension that factors into the equation: the amount of data, both in number of training examples and number of users. The cost of using more  data isn’t free — this increases the amount of compute — but it’s another knob we can turn to arrive at an acceptable operating point across all of these dimensions.

### Playground

There are lots of other knobs to turn in a federated learning setting. All these variables interact in complicated ways. Click on a value for each variable to run a particular configuration, or the variable name to sweep over all of its options. Go ahead and play around — try mixing them together!<a class='footstart'>5</a>

<div class='federate-playground playground-full'></div>

### More Reading

This [comic](https://federated.withgoogle.com/) serves as a gentle visual introduction to federated learning. Google AI’s blog post [introducing federated learning](https://ai.googleblog.com/2017/04/federated-learning-collaborative.html) is another great place to start.

Though this post motivates federated learning for reasons of user privacy, an [in depth discussion of privacy](https://queue.acm.org/detail.cfm?id=3501293) considerations - namely  *data minimization* and *data anonymization* - and the tactics aimed at addressing these concerns is beyond its scope.

[Previous explorables](https://pair.withgoogle.com/explorables/private-and-fair/) have discussed the privacy/accuracy/data trade-off in more detail, with a focus on example-level differential privacy. In many real applications, we care more about [user-level differential privacy](https://ai.googleblog.com/2022/02/federated-learning-with-formal.html), which prevents information about any user from being leaked by a published model. Not only is user-level differential privacy stronger than example-level differential privacy, it is quite natural to apply in a federated learning setting since each device has only a single user’s data.

There is a wide array of research on [Advances and Open Problems in Federated Learning](https://arxiv.org/abs/1912.04977) — spanning modeling, system design, network communication, security, privacy, personalization and fairness. Another area of research and development is in [federated analytics](https://ai.googleblog.com/2020/05/federated-analytics-collaborative-data.html), which applies the federated framework to answer basic data science questions that do not involve learning without centralized data collection.

If you’re interested in trying out federated learning or federated analytics, [TensorFlow Federated](https://www.tensorflow.org/federated) is an open-source framework you can use. This [video series](https://www.youtube.com/watch?v=JBNas6Yd30A) and set of [tutorials](https://www.tensorflow.org/federated/tutorials/tutorials_overview) will help you get started.

### Credits 

Nicole Mitchell and Adam Pearce // November 2022

Thanks to Nithum Thain, Alex Ingerman, Brendan McMahan, Hugo Song, Daniel Ramage, Peter Kairouz, Alison Lentz, Kallista Bonawitz, Jakub Konečný, Zachary Charles, Marco Zamarato, Zachary Garrett, Lucas Dixon, James Wexler, Martin Wattenberg, Astrid Bertrand and the Quirk Research team for their help with this piece.  


### Footnotes 

<a class='footend'></a> For an [end-to-end encrypted](https://en.wikipedia.org/wiki/End-to-end_encryption) messaging application, centralized learning won't work.

<a class='footend'></a> More cryptographically sophisticated [protocols](https://dl.acm.org/doi/10.1145/3133956.3133982) can be used so a connection between every user isn't required and the sums can still be computed if some users drop out. 

<a class='footend'></a> Curious how these models are being trained and what's going on in each "local step"? Check out the [TensorFlow Playground](https://playground.tensorflow.org/).

<a class='footend'></a> In the [cross-device setting](https://queue.acm.org/detail.cfm?id=3501293#:~:text=%E2%80%A2%20Cross%2Ddevice%20FL%2C%20where%20the%20clients%20are%20large%20numbers%20of%20mobile%20or%20IoT%20devices.) (e.g., billions of smartphones), a small fraction of all devices are sampled to participate in each round; typically any one device will contribute to training a handful of times at most. This spreads out the load of training, and ensures the model sees a diversity of different devices. In the [cross-silo setting](https://queue.acm.org/detail.cfm?id=3501293#:~:text=%E2%80%A2%20Cross%2Dsilo%20FL%2C%20where%20the%20clients%20are%20a%20typically%20smaller%20number%20of%20organizations%2C%20institutions%2C%20or%20other%20data%20silos.), a small number of larger and more reliable users are assumed (e.g., organizations, datacenters).

<a class='footend'></a> In a real cross-device FL training system, each sampled device would generally only compute a fixed relatively small number of local steps before averaging.

<a class='footend'></a> The system below merges the local models every 20 local training steps. 

<a class='footend'></a> Simply including all types of users is often not enough to ensure fairness. Designing strategies for learning a model that performs equally well for everyone is an active area of research. Personalization through local fine-tuning of a final global model is one promising approach. 

<a class='footend'></a> This might not seem like the biggest deal for this scenario, but participation in medical trials can be highly sensitive and more complex models can [leak](https://pair.withgoogle.com/explorables/data-leak/) information.

<a class='footend'></a> It’s important to remember that this is a simple model and a very small scale federated learning simulation. The phenomena you observe might not be fully representative of what happens in practice.  



### More Explorables 

<p id='recirc'></p>

<div class='recirc-feedback-form'></div>


<link href='https://fonts.googleapis.com/icon?family=Material+Icons' rel="stylesheet">
<link rel='stylesheet' href='../third_party/footnote.css'>

<script src='../third_party/d3_.js'></script>

<script src='../third_party/d3-scale-chromatic.v1.min.js'></script>
<script src='../third_party/tfjsv3.18.0.js'></script>


<link rel='stylesheet' href='spam-animation/style.css'>
<script src='spam-animation/init.js'></script>

<link rel='stylesheet' href='secure-aggregation/style.css'>
<script src='secure-aggregation/init.js'></script>

<link rel='stylesheet' href='playground/style.css'>

<script src='../third_party/footnote.js'></script>
<script src='playground/tf-util.js'></script>
<script src='playground/chart.js'></script>
<script src='playground/weights.js'></script>
<script src='playground/show-model-training.js'></script>
<script src='playground/init-playground.js'></script>
<script src='playground/init-playground-custom.js'></script>

<script src='playground/init.js'></script>

<script src='mobile-scale.js'></script>


<script src='init.js'></script>
<link href='style.css' rel='stylesheet'>

<script src='../third_party/swoopy-drag.js'></script>
<script src='swoopy.js'></script>


<script src='../third_party/recirc.js'></script>