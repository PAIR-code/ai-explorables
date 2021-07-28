window.makeParams = function(){
  var url = new URL(window.location)
  var searchParams = new URLSearchParams(url.search) 

  var rv = {}

  rv.get = key => {
    return searchParams.get(key)
  }

  rv.set = (key, value) => {
    searchParams.set(key, value)

    url.search = searchParams.toString()
    history.replaceState(null, '', url)
  }

  return rv
}


if (window.init) init()