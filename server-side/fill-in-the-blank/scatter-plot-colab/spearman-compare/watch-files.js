!(function(){
  function watchFile(path){
    var lastStr = ''

    console.log(path)
    function check(){
      d3.text(path + '?' + Math.random(), (err, nextStr) => {
        if (err){
          console.log(err)
          return check()
        }

        if (nextStr == lastStr) return
        lastStr = nextStr

        if (path.includes('.js')){
          console.log('js', new Date())
          Function(nextStr.replace('\n', ';').replace('\n', ';'))()
        }

        if (path.includes('.css')){
          console.log('css', new Date())

          Array.from(document.querySelectorAll('link'))
            .filter(d => d.href.includes(path) || d.href.includes('__hs_placeholder'))
            .forEach(d => d.href = path + '?' + Math.random())
        }
      })

      if (python_settings.isDev) setTimeout(check, 100)
    }
    check()
  }

  ;[
    'style.css', 
    '../two-sentences/init-scatter.js', 
    '../two-sentences/init-util.js', 
    '../two-sentences/init-pair.js', 
    'init.js'
  ].forEach(filename => {
    var root = document.currentScript.src.replace('watch-files.js', '').split('?')[0]
    var path = root + filename

    if (python_settings.isDev){
      watchFile(path)
    } else {
      if (path.includes('.js')){
        var node = document.createElement('script')
        node.setAttribute('src', path)
        document.body.appendChild(node)
      }

      if (path.includes('.css')){
        Array.from(document.querySelectorAll('link'))
          .filter(d => d.href.includes(path) || d.href.includes('__hs_placeholder'))
          .forEach(d => d.href = path + '?' + Math.random())
      }
    }
  })
})()



