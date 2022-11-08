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




d3.loadData('../posts.json', (err, res) => {
  var posts = res[0]
    .filter(d => !window.location.href.includes(d.permalink))
    .filter(d => d.shareimg.includes('http'))
  posts = d3.shuffle(posts)

  var isMobile = innerWidth < 900 
  var postSel = d3.select('#recirc').html('').appendMany('a.post', posts)
    .st({
      width: isMobile ? '100%' : '330px', 
      display: 'inline-block', 
      verticalAlign: 'top',
      marginRight: isMobile ? 0 : 30,
      textDecoration: 'none',
    })
    .at({href: d => '..' + d.permalink})


  postSel.append('div.img')
    .st({
      width: '100%', 
      height: 200,
      backgroundImage: d => `url(${d.shareimgabstract || d.shareimg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    })

  postSel.append('p.title')
    .text(d => d.shorttitle || d.title)
    .st({
      verticalAlign: 'top',
      marginTop: 10,
      textDecoration: 'none',
    })

  postSel.append('p.summary')
    .text(d => d.socialsummary || d.summary)

  d3.selectAll('h3')
    .filter(function(){ return d3.select(this).text() == 'More Explorables'})
    .classed('more-explorables-h3', true)

  d3.selectAll('.recirc-feedback-form *').remove()

  var height = innerWidth < 800 ? 760 : 660
  var formSel = d3.select('.recirc-feedback-form')
  if (!formSel.node()) formSel = d3.select('body').insert('div.recirc-feedback-form', '.more-explorables-h3')
  formSel
    .st({marginTop: 40})
    .append('p')
    .html(`<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSf9S2enUtgI0ujZfPr93AU8f0DMi7B5NaXOFj49v1qs3pUngw/viewform?embedded=true" width="100%" height="${height}" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`)


})