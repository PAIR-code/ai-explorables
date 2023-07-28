/* Copyright 2023 Google LLC. All Rights Reserved.

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

window.initInputSliders = function({sel, state, hasColor=true}){
  var sliders = ['a', 'b'].map((key, i) => ({
    sel: sel.append('div.slider'),
    key,
    i,
    getVal: _ => state[key],
    setVal: d => state[key] = +d
  }))

  sliders.forEach(slider => {
    slider.sel.html(`
      <div style='color:${hasColor ? util.colors[slider.key + 'Input'] : ''}'>
        ${slider.key}: <val></val>
      </div>
      <div>
        <input type=range min=0 max=${state.n_tokens - 1} step=1 value=${slider.getVal()}></input>
      </div>
    `)

    slider.sel.select('input[type="range"]')
      .on('input', function () {
        slider.setVal(this.value)
        state.renderAll.input()
      })
    state.renderAll.input.fns.push(() => {
      var value = slider.getVal()
      slider.sel.select('val').text(value)
      slider.sel.select('input').node().value = value
    })

  })
}


// window.initHandWeights?.()
window.initModBot?.()
