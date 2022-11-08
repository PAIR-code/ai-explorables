// console.clear()
window.ttSel = d3.select('body').selectAppend('div.tooltip.tooltip-hidden')


var users = ['Alice', 'Bob', 'Calvin']
var text_messages = [['IT\'S TACO TUESDAY 🌮🌮🌮','Get your free tacos at','www.getfreetacos.com'],
         ['hello'],
         ['Hello <user>, Your flight','is about to take off!','Download our app for free','in-flight entertainment at','www.getfreemovies.com'],
         ['Hello, this is Susie from','class!'],
         ['If you\'re free, want to','grab tacos with me','and Amy at','www.tacoshop.com?']]

function generateText(data, idx) {
  var svg = d3.select('#spam-message')
        .append('svg')
        .data(data)
        .attr('width', 250)
        .attr('height', 40 + 20 * (data.length-1));

  var rect = svg.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('rx', 20)
          .attr('ry', 20)
          .attr('width', 250)
          .attr('height', 40 + 20 * (data.length-1))
          .attr('stroke', 'none')
          .attr('fill', '#69a3b2')
          // .attr('opacity', 0.2);

  data.forEach(function (line, i) {
    var text = svg.append('text')
            .attr('x', 20)
            .attr('y', 20 + i * 20)
            .attr('width', 250)
            .attr('height', 20)
            .text(line)
  })

  return svg
}

d3.select('#spam-message').html('')
// text_messages.forEach(generateText)



function renderTextDivs(){
  var divTextMessages = text_messages.map(d => d.join(' '))

  var sel = d3.select('#spam-message-div').html('')
    // .st({height: 100, background: '#f0f'})

  sel.appendMany('div', divTextMessages)
    .text(d => d)
    .st({
      display: 'inline-block',
      background: '#69a3b2',
      width: 230,
      verticalAlign: 'top',
      margin: 10,
      padding: 10,
      borderRadius: 20,
    })
}
// renderTextDivs()


d3.loadData('spam-data.tsv', (err, [messages]) => {
  var keywords = ['free', 'taco', 'hello', 'this'].map(d => {
    return {token: d}
  })
  var isKeyword = {}
  keywords.forEach(d => isKeyword[d.token] = true)
  // console.log(isKeyword)

  messages.forEach(message => {
    message.isSpam = !!message.isSpam

    message.tokens = message.text
      .replaceAll('\n', ' ')
      .split(' ')
      .map(origStr => {
        var lowerStr = origStr
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')

        if (lowerStr != 'this'){
          if (_.last(lowerStr) == 's') lowerStr = lowerStr.slice(0, -1)
        }

        return {origStr, lowerStr}
      })
  })

  window.byUser = d3.nestBy(messages, d => d.user)
  byUser.forEach(user => {
    user.keywords = keywords.map(({token}) => {
      return {token, percentSpam: .5}
    })

    // console.log(user)
  })


  var userSel = d3.select('#users').html('')
    .appendMany('div', byUser)
    .st({
      display: 'inline-block',
      width: 260,
      verticalAlign: 'top',
      // textAlign: 'center'
    })

  userSel.append('h4').text(d => d.key)

  var messageSel = userSel
    .append('div').st({height: 340})
    .appendMany('div', d => d)
    // .call(d3.attachTooltip)
    .st({
      display: 'inline-block',
      background: '#69a3b2',
      verticalAlign: 'top',
      margin: 10,
      padding: 10,
      borderRadius: 20,
      userSelect: 'none',
      cursor: 'pointer',
    })
    .on('click', d => {
      d.isSpam = !d.isSpam

      renderMessages()
    })

  messageSel
    .appendMany('span', d => d.tokens)
      .text(d => d.origStr + ' ')
      .st({
        // background: d => d.lowerStr == 'taco' ? '#f0f' : ''
        textDecoration: d => isKeyword[d.lowerStr] ? 'underline' : ''
      })



  var userKeywordsSel = userSel.append('div')
  userKeywordsSel.append('h3').text('Keywords')

  var userKeywordSel = userKeywordsSel
    .appendMany('div', d => d.keywords)

  userKeywordSel.append('span').text(d => d.token)
    .st({fontWeight: 600, width: 50, display: 'inline-block'})

  var percentSel = userKeywordSel.append('span')
    .st({width: 50, display: 'inline-block'})

  var barSel = userKeywordSel.append('div')
    .st({display: 'inline-block'})
    .text(' ')

  function renderMessages(){
    byUser.forEach(user => {
      user.keywords.forEach(keyword => {
        keyword.percentSpam = d3.mean(user, message => {
          var hasKeyword = message.tokens.some(d => d.lowerStr == keyword.token)
          return hasKeyword && message.isSpam
        })
      })
    })

    percentSel.text(d => d3.format('.0%')(d.percentSpam))

    messageSel
      .st({
        outline: d => d.isSpam ? '10px solid red' : '',
      })

    barSel.st({width: d => d.percentSpam*100, background: 'red', height: 10, position: 'relative', top: 0, left: -10})

  }
  renderMessages()






})