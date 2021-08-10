// console.clear()
// d3.select('body').selectAppend('div.tooltip.tooltip-hidden')


// window.bertProcessedVocab = python_data.vocab
// var tokenizer = new BertTokenizer()
// tokenizer.load()

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
