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




window.makeSlides = function(){
  var slides = [
    {
      textFill: '#aaa',
      textStroke: 0,
      rectFill: d => d.isSick ? lcolors.sick : lcolors.well,
      rectOpacity: d => 0,
      threshold: .8,
      fpAxisOpacity: 0,
      sexAxisOpacity: 0,
      brAxisOpacity: 0,
      truthAxisOpacity: 0,
      mlAxisOpacity: 0,
      pos: 'all',
      botAxisY: c.width + 80,
    },

    {
      textFill: d => d.isSick ? colors.sick : colors.well,
      truthAxisOpacity: 1,
    },

    {
      rectOpacity: d => 1,
      mlAxisOpacity: 1,

    },

    {
      rectFill: d => d.grade > gs.curSlide.threshold ? lcolors.sick : lcolors.well,
      textStroke: d => d.grade > gs.curSlide.threshold == d.isSick ? 0 : .6,
      fpAxisOpacity: 1,
    },

    {
      threshold: .61,
      animateThreshold: true,
    },

    {
      threshold: .89,
      animateThreshold: true,
    },

    {
      pos: 'sex',
      fpAxisOpacity: 0,
      sexAxisOpacity: 1,
      threshold: .7508,
      animateThreshold: false,
      botAxisY: c.width + 150,

    },

    {
      brAxisOpacity: 1,
      sexAxisOpacity: 0,

    },

    {

    }

  ]

  var keys = []
  slides.forEach(d => keys = keys.concat(d3.keys(d)))
  _.uniq(keys).forEach(str => {
    var prev = null
    slides.forEach(d => {
      if (typeof(d[str]) === 'undefined'){
        d[str] = prev
      }
      prev = d[str]
    }) 
  })

  return slides
}



if (window.init) window.init()
