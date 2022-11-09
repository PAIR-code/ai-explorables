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


var infoSel = d3.select('.info-box').html('')
  .st({border: '1px solid orange', background: 'rgba(255,250,241,.5)', maxWidth: 750, margin: '0 auto', padding: 20, paddingTop: 5, paddingBottom: 5})
  // .st({textAlign: })

infoSel.append('p')
  .st({marginLeft: 10})
  .html('Not familiar with how machine learning models are trained or why they might leak data? <br>These interactive articles will get you up to speed.')
  .html('New to some of these concepts? These interactive articles will get you up to speed.')
  .html('New to machine learning or differential privacy? These interactive articles will get you up to speed.')

var articles = [
  {
    img: 'https://pair.withgoogle.com/explorables/images/anonymization.png',
    title: 'Collecting Sensitive Information',
    permalink: 'https://pair.withgoogle.com/explorables/anonymization/',
  },
  {
    img: 'https://pair.withgoogle.com/explorables/images/model-inversion.png',
    title: 'Why Some Models Leak Data',
    permalink: 'https://pair.withgoogle.com/explorables/data-leak/',
  },
  {
    img: 'http://playground.tensorflow.org/preview.png',
    title: 'TensorFlow Playground',
    permalink: 'https://playground.tensorflow.org'
  },
]

var postSel = infoSel.appendMany('a.post', articles)
  .st({
    textAlign: 'center',
    width: '30.5%', 
    display: 'inline-block', 
    verticalAlign: 'top',
    marginLeft: 10,
    marginRight: 10,
    textDecoration: 'none',
  })
  .at({href: d => d.permalink})

postSel.append('div.img')
  .st({
    width: '100%', 
    height: 80,
    backgroundImage: d => `url(${d.img})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    outline: '1px solid #ccc'
  })

postSel.append('p.title')
  .text(d => d.title)
  .st({
    verticalAlign: 'top',
    marginTop: 10,
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
  })
