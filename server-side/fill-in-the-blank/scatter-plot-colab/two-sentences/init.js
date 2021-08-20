/* Copyright 2021 Google LLC. All Rights Reserved.

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

window.init = function(){
  var initFns = [window.initUtil, window.initScatter, window.initPair]
  if (!initFns.every(d => d)) return

  window.util = initUtil()

  var pair = window.python_settings
  pair.s0 = python_data.s0
  pair.s1 = python_data.s1
  pair.e0 = python_data.e0
  pair.e1 = python_data.e1
  pair.label0 = 'Sentence 0'
  pair.label1 = 'Sentence 1'
  pair.vocab = python_data.vocab

  var sel = d3.select('.container').html('')
    .st({width: 500})

  initPair(pair, sel)
}


window.init()
