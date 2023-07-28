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



window.initFullInputSliders = function({sel, state, hasColor=true}){
  var sliders = ['a', 'b', 'correctRaw', 'diff'].map((key, i) => ({
    sel: sel.append('div.slider'),
    key,
    ppKey: key
      .replace('correctRaw', `a + b mod ${state.n_tokens}`)
      .replace('diff', `a - b mod ${state.n_tokens}`),
    i,
    getVal: _ => state[key],
    setVal: d => state[key] = +d
  }))

  sliders.forEach(slider => {
    slider.sel.html(`
      <div>
        ${slider.ppKey} = <val></val>
      </div>
      <div>
        <input 
          type=range 
          min=0 
          max=${slider.key == 'correctRaw' ? state.n_tokens*2 - 1 : state.n_tokens - 1} 
          step=1 
          value=${slider.getVal()}>
        </input>
      </div>
    `)

    slider.sel.select('input[type="range"]')
      .on('input', function () {
        slider.setVal(this.value)
        var {n_tokens, correctRaw, diff}  = state

        if (slider.key == 'correctRaw'){
          state.a = (n_tokens + Math.floor(correctRaw/2 + diff/2)) % n_tokens
          state.b = (n_tokens + Math.floor(correctRaw/2 - diff/2)) % n_tokens
        }
        if (slider.key == 'diff'){
          var correct = correctRaw % n_tokens
          state.a = (n_tokens + Math.floor(correct/2 + diff/2)) % n_tokens
          state.b = (n_tokens + Math.ceil(correct/2 - diff/2)) % n_tokens
        }

        state.renderAll.input()
      })
    state.renderAll.input.fns.push(() => {
      state.correctRaw = state.a + state.b
      state.correct = state.correctRaw % state.n_tokens
      state.diff = (state.n_tokens + state.a - state.b) % state.n_tokens

      var value = slider.getVal()
      slider.sel.select('val').text(value % state.n_tokens)
      slider.sel.select('input').node().value = value
    })

  })
}
window.initAppendix?.()
