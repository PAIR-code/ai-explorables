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

  console.log(posts)


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


})