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



// TODO: use fixed data
var nouns = ['tea', 'soda', 'pie', 'cake']
var spamNoun = nouns[2] 

var normalTemplates = [
  'free _ tomorrow!',
  'hey, do you like _?',
  '_ is my favorite!',
  'what flavor _ do you want', 
  'want to get _ with me?',
  'i love _ so much',
  'the store is out of _ :/',
  `a new _ shop is openning!`,
  'no _ for me, thank you',
  'please pick up some _',
  'oooo more _ please',
  'get me some _?',
  'the _ was great!',
  'never had pink _ before :p',
  'want more _ tomorrow?',
  "i'll buy some _",
  'no more _ for me, thx',
  "they do love their _.",
  'want _ with that?',
]

var spamTemplates = [
  'go to www.get-free-_.com',
  'BUY _ NOW',
  'www.get-free-_.com',
]

var people = ['Alice', 'Bob', 'Carol'].map(name => ({name}))

var seed = new Math.seedrandom('9bca')
var random = d3.randomUniform.source(seed)()

people.forEach(person => {
  var prevTemplates = []
  person.messages = d3.range(12)
    .map(d => {
      var noun = _.sample(nouns)
      var isSpam = noun == spamNoun
      if (random() < .1) isSpam = !isSpam

      var nonDupNormalTemplates = normalTemplates
        .filter(d => prevTemplates.every(e => e != d))

      var template = _.sample(isSpam ? spamTemplates : nonDupNormalTemplates)
      var text = template.replace('_', noun)
      if (text[0] == 'B') text = text.toUpperCase()

      prevTemplates.push(template)
      prevTemplates = prevTemplates.slice(-8)

      return {text, noun, isSpam, person}
    })

    // .filter(d => !(d.noun == nouns[3] && person.name == 'Alice' && d.isSpam))
})

var allMessages = _.flatten(people.map(d => d.messages))

var renderSpam = (function(){
  var rv = () => rv.fns.forEach(d => d())
  rv.fns = []
  return rv
})()

function drawCentral(){
  var c = d3.conventions({
    sel: d3.select('.central-spam-model').html('').classed('spam-model', 1).st({margin: '0px auto'}),
    width: 605,
    layers: 'sd',
    margin: {top: 0, left: 0, right: 0, bottom: 0},
  })

  var divSel = c.layers[1]

  var peopleSel = drawPeopleSel(allMessages, divSel)
  var {serverSel, tableSel} = drawServerSel(allMessages, divSel)
  var wordWeightSel = drawModelSel(allMessages, serverSel)


  peopleSel.each(function(d, i){
    midRightToMidLeft(d3.select(this), tableSel, c, i*50 - 10, 0)
  })

  midBotToMidLeft(tableSel, wordWeightSel.parent(), c, 0)
  divSel.append('div.caption').html(`With <b>centralized training</b>, each user's data is uploaded to a server where a single model is trained.`).st({maxWidth: 320})
}
drawCentral()

function drawLocal(){
  var c = d3.conventions({
    sel: d3.select('.local-spam-model').html('').classed('spam-model', 1),
    width: 450,
    layers: 'sd',
    margin: {top: 0, left: 0, right: 0, bottom: 0},
  })

  var divSel = c.layers[1]

  var peopleSel = drawPeopleSel(allMessages, divSel)
  var peopleModelSel = drawPeopleModelSel(allMessages, divSel)

  peopleSel.each(function(d, i){
    midRightToMidLeft(d3.select(this), d3.select(peopleModelSel._groups[0][i]), c, 0, 2, 0)
  })
  divSel.append('div.caption').html('Each user <b>locally trains</b> a spam model independently — no information is shared with a server.').st({maxWidth: 350})
}
drawLocal()

function drawFederated(){
  var c = d3.conventions({
    sel: d3.select('.federated-spam-model').html('').classed('spam-model', 1),
    width: 699,
    layers: 'sd',
    margin: {top: 0, left: 0, right: 0, bottom: 0},
  })

  var divSel = c.layers[1]

  var peopleSel = drawPeopleSel(allMessages, divSel)
  var peopleModelSel = drawPeopleModelSel(allMessages, divSel)

  var {serverSel, tableSel} = drawServerSel(allMessages, divSel, 1)
  var wordWeightSel = drawModelSel(allMessages, serverSel, '', 1)


  peopleSel.each(function(d, i){
    midRightToMidLeft(d3.select(this), d3.select(peopleModelSel._groups[0][i]), c, 0, 2, 0, 0)
  })

  peopleModelSel.each(function(d, i){
    midRightToMidLeft(d3.select(this), tableSel, c, i*50 - 10, 0,)
  })

  midBotToMidLeft(tableSel, wordWeightSel.parent(), c, 0)

  divSel.append('div.caption').html('<b>Naively combining models</b> across users produces a shared model but could compromise user privacy.').st({maxWidth: 350, })
}
drawFederated()

function drawSecureFederated(){
  var c = d3.conventions({
    sel: d3.select('.secure-federated-spam-model').html('').classed('spam-model', 1),
    width: 699,
    layers: 'sd',
    margin: {top: 0, left: 0, right: 0, bottom: 0},
  })

  var divSel = c.layers[1]

  var peopleSel = drawPeopleSel(allMessages, divSel)
  var peopleModelSel = drawPeopleModelSel(allMessages, divSel)

  var {serverSel, tableSel, aggSel} = drawServerSel(allMessages, divSel, 1, 1)
  var wordWeightSel = drawModelSel(allMessages, serverSel, '', 1)


  peopleSel.each(function(d, i){
    midRightToMidLeft(d3.select(this), d3.select(peopleModelSel._groups[0][i]), c, 0, 2, 0)
  })

  peopleModelSel.each(function(d, i){
    midRightToMidLeft(d3.select(this), aggSel, c, i*20 - 10, 0)
  })

  midBotToMidTop(aggSel, tableSel, c)
  midBotToMidLeft(tableSel, wordWeightSel.parent(), c, 0)

  divSel.append('div.caption').html('<b>Federated learning</b> — shown here with secure aggegation — produces a shared model while protecting user privacy.').st({maxWidth: 410, })
}
drawSecureFederated()


renderSpam()


function addChatMsgHover(selection, parentSel){
  selection
    .on('mouseover', d => {
      parentSel.selectAll('.chat-msg-hover')
        .classed('hovered', 0)
        .filter(e => d == e || (e.includes && e.includes(d)))
        .classed('hovered', 1)
        .each(function(){
          this.scrollIntoView({block: 'nearest'})
        })
    })
    .on('mouseout', d => {
      d3.selectAll('.chat-msg-hover')
        .classed('hovered', 0)
    })
}

function drawPeopleSel(allMessages, divSel){
  var peopleSel = divSel.append('div')
    .st({width: 250}) 
    .appendMany('div', people)
    .st({paddingBottom: 10, marginBottom: 10})

  peopleSel.append('div.block-title').text(d => d.name)

  var messageSel = peopleSel.append('div.chat-message-container.no-scroll-bar')
    .appendMany('div.chat-message.chat-msg-hover', d => d.messages)
    .text(d => d.text)
    .on('click', d => {
      d.isSpam = !d.isSpam
      renderSpam()
    })
    .call(addChatMsgHover, divSel.parent())

  renderSpam.fns.push(() => messageSel.classed('is-spam', d => d.isSpam))

  peopleSel.select('.chat-message-container').each(function(){
    this.scrollTop = random()*200
  })

  return peopleSel
}

function drawPeopleModelSel(allMessages, divSel){
  var peopleModelSel = divSel.append('div')
    .st({marginLeft: 50}) 
    .appendMany('div', people)
    .st({paddingBottom: 10, marginBottom: 10, paddingLeft: '2px', height: 145})

  peopleModelSel.each(function(person){
    drawModelSel(allMessages.filter(d => d.person == person), d3.select(this), person.name + "'s ")
  })

  return peopleModelSel
}

function drawServerAggregationSel(divSel){
  var serverAggregationSel = divSel.append('div')
    .st({marginLeft: 50})
    .st({paddingBottom: 10, marginBottom: 10, paddingLeft: '2px', height: 145})
}

function drawServerSel(allMessages, divSel, isFederated, isSecure){
  var serverSel = divSel.append('div.server-container')
    .st({width: isFederated ? 200 : ''})

  if (isFederated){
    var messageByNounPerson = _.sortBy(d3.nestBy(allMessages, d => [d.noun, d.person.name]), d => d.key)
    messageByNounPerson.forEach(d => d.percentSpam = d3.mean(d, e => e.isSpam))

    if (isSecure){
      var messageByNoun = _.sortBy(d3.nestBy(messageByNounPerson, d => d.key.split(',')[0]), d => d.noun)
      messageByNoun.forEach(d => d.percentSpam = d3.mean(d, e => e.percentSpam))

      var aggSel = serverSel.append('div.aggregation-container')
      aggSel.append('div.block-title').text('Secure Aggregation')
      var aggBox = aggSel.append('div.aggregation-box')
        .html(`<i class='material-icons'>lock</i>`)
      serverSel.append('div.block-title').text('Central Server')
      var tableSel = serverSel.append('div.data-table.aggregated.no-scroll-bar')
      var rowSel = tableSel.appendMany('div', messageByNoun)
      renderSpam.fns.push(() => {
        messageByNounPerson.forEach(d => d.percentSpam = d3.mean(d, e => e.isSpam))
        messageByNoun.forEach(d => d.percentSpam = d3.mean(d, d => d.percentSpam))
        rowSel.html(d => `
          <div><span>word:</span> ${d[0].key.split(',')[0]}</div>
          <div><span>spam_x%:</span> ${d3.format('.3%')(d3.mean(d, e => e.percentSpam))}</div>
        `)
      })

      return {serverSel, tableSel, aggSel}
    } else {
      serverSel.append('div.block-title').text('Central Server')

      var tableSel = serverSel.append('div.data-table.no-scroll-bar')
      var rowSel = tableSel.appendMany('div.chat-msg-hover', messageByNounPerson)
      renderSpam.fns.push(() => {
        rowSel.html(d => `
          <div><span>user:</span> ${d[0].person.name}</div>
          <div><span>word:</span> ${d[0].noun}</div>
          <div><span>spam_x%:</span> ${d3.format('.3%')(d3.mean(d, e => e.isSpam))}</div>
        `)
      })
    }    
  } else {
    serverSel.append('div.block-title').text('Central Server')

    var tableSel = serverSel.append('div.data-table.no-scroll-bar')
    var rowSel = tableSel.appendMany('div.chat-msg-hover', _.shuffle(allMessages))
      .on('click', d => {
        d.isSpam = !d.isSpam
        renderSpam()
      })
      .st({cursor: 'pointer'})
      .call(addChatMsgHover, divSel)
    renderSpam.fns.push(() => {
      rowSel.html(d => `
        <div><span>user:</span> ${d.person.name}</div>
        <div><span>msg:</span> ${d.text}</div>
        <div><span>isSpam:</span> ${d.isSpam}</div>
      `)
    })
  }

  return {serverSel, tableSel}
}

function drawModelSel(allMessages, parentSel, name='', isFederated){
  var messageByNoun = _.sortBy(d3.nestBy(allMessages, d => d.noun), d => d.key)
  messageByNoun.forEach(d => d.percentSpam = d3.mean(d, e => e.isSpam))

  var modelSel = parentSel.append('div.model-container')

  modelSel.append('div.block-title').text(name + 'Spam Model')

  if (isFederated){
    var messageByNounPerson = _.sortBy(d3.nestBy(allMessages, d => [d.noun, d.person.name]), d => d.key)
    messageByNounPerson.forEach(d => d.percentSpam = d3.mean(d, e => e.isSpam))
    var messageByNoun = d3.nestBy(messageByNounPerson, d => d[0].noun)
    messageByNoun.forEach(d => d.percentSpam = d3.mean(d, d => d.percentSpam))
  }

  var wordWeightSel = modelSel.append('div.model-table.no-scroll-bar')
    .appendMany('div.word-in-model', messageByNoun)

  renderSpam.fns.push(() => {
    if (isFederated){
      messageByNounPerson.forEach(d => d.percentSpam = d3.mean(d, e => e.isSpam))
      messageByNoun.forEach(d => d.percentSpam = d3.mean(d, d => d.percentSpam))
    } else {
      messageByNoun.forEach(d => d.percentSpam = d3.mean(d, e => e.isSpam))
    }

    wordWeightSel.html('')
    wordWeightSel.append('div').text(d => d.key).st({width: 40, position: 'relative', top: 5,})
    wordWeightSel
      .append('div')
      .st({height: 17, background: '#eee', width: 90, position: 'relative', top: 7})
      .append('div')
      .st({height: 17, background: '#EB0C0C', width: d => d.percentSpam*100 + '%'})
      .parent()
      .append('div')
      .text(d => d3.format('.0%')(d.percentSpam))
      .st({top: 2, position: 'absolute', left: d => `calc(${d.percentSpam*100}% + 2px)`})
      .filter(d => d.percentSpam > .5)
      .st({left:'', right: d => 90*(1 - d.percentSpam) + 2, color: '#fff'})

  })


  return wordWeightSel
}


function midRightToMidLeft(a, b, c, y1Offset=0, x1Offset=3, strokeDasharray){
  var aBox = a.node().getBoundingClientRect()
  var bBox = b.node().getBoundingClientRect()
  var pBox = c.sel.node().getBoundingClientRect()

  var [x0, x1] = [aBox.x + aBox.width, bBox.x].map(d => d - pBox.x)
  var [y0, y1] = [aBox.y + aBox.height/2, bBox.y + bBox.height/2].map(d => d - pBox.y)

  y1 = y1 + y1Offset
  x1 = x1 + x1Offset

  c.svg.append('path.dotted-path')
    .at({
      d: `M ${[x0, y0]} C ${[x1, y0, x0, y1, x1, y1]}`,
      stroke: '#888',
      fill: 'none',
    })
    .st({strokeDasharray})

  c.svg.append('circle')
    .at({r: 4, cx: x1, cy: y1, fill: '#888'})
}

function midBotToMidLeft(a, b, c, strokeDasharray){
  var aBox = a.node().getBoundingClientRect()
  var bBox = b.node().getBoundingClientRect()
  var pBox = c.sel.node().getBoundingClientRect()

  var [x0, x1] = [aBox.x + aBox.width/2, bBox.x].map(d => d - pBox.x)
  var [y0, y1] = [aBox.y + aBox.height, bBox.y + bBox.height/2].map(d => d - pBox.y)

  x0 = x0 - 90
  y1 = y1 + 0

  c.svg.append('path.dotted-path')
    .at({
      d: `M ${[x0, y0]} C ${[x0, y1, x1, y1, x1, y1]}`,
      stroke: '#888',
      fill: 'none',
    })
    .st({strokeDasharray})

  c.svg.append('circle')
    .at({r: 4, cx: x1, cy: y1, fill: '#888'})
}

function midBotToMidTop(a, b, c, strokeDasharray){
  var aBox = a.node().getBoundingClientRect()
  var bBox = b.node().getBoundingClientRect()
  var pBox = c.sel.node().getBoundingClientRect()

  var [x0, x1] = [aBox.x + 7*aBox.width/8, bBox.x + 7*bBox.width/8].map(d => d - pBox.x)
  var [y0, y1] = [aBox.y + aBox.height, bBox.y].map(d => d - pBox.y)

  // y0 = y0 + 10
  // x1 = x1 + 80

  c.svg.append('path.dotted-path')
    .at({
      d: `M ${[x0, y0]} C ${[x1, y0, x0, y1, x1, y1]}`,
      stroke: '#888',
      fill: 'none',
    })
    .st({strokeDasharray})

  c.svg.append('circle')
    .at({r: 4, cx: x1, cy: y1, fill: '#888'})
}


// 
// TODO

// - click to spam tag
// - not that taking mean of means isn't the same as mean