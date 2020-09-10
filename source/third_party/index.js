// https://github.com/1wheel/roadtolarissa Copyright 2018 Adam Pearce

var fs = require('fs')
var {exec, execSync} = require('child_process')

var source = `${__dirname}/../../source`
var public = `${__dirname}/../../public`
if (!fs.existsSync(public)) fs.mkdirSync(public)

function rsyncSource(){
  exec(`rsync -a --exclude _posts --exclude _templates ${source}/ ${public}/`)
}
rsyncSource()

var hljs = require('highlight.js')
var marked = require('marked')
marked.setOptions({
  highlight: (code, lang) => hljs.highlight(lang || 'html', code).value,
  smartypants: true
})

var templates = {}
readdirAbs(`${source}/_templates`).forEach(path => {
  var str = fs.readFileSync(path, 'utf8')
  var templateName = path.split('_templates/')[1]
  templates[templateName] = d => eval('`' + str + '`')
})

function readdirAbs(dir){ return fs.readdirSync(dir).map(d => dir + '/' + d) }

var posts = readdirAbs(`${source}/_posts`)
  .filter(d => !d.includes('.DS_Store'))
  .map(parsePost)
  
fs.writeFileSync(public + '/rss.xml',  templates['rss.xml'](posts))
fs.writeFileSync(public + '/sitemap.xml', templates['sitemap.xml'](posts))

function parsePost(path){
  var str = fs.readFileSync(path, 'utf8')
  if (str[0] == '<') str = str.split('License.\n-->')[1]
  var [top, body] = str
    .replace('---\n', '')
    .split('\n---\n')

  console.log(path)

  var post = {html: path.includes('.html') ? body : marked(body)}
  top.split('\n').forEach(line => {
    var [key, val] = line.split(/: (.+)/)
    post[key] = val
  })

  return post
}

function writePost(post){
  var dir = public + post.permalink
  if (!fs.existsSync(dir)) execSync(`mkdir -p ${dir}`)
  fs.writeFileSync(`${dir}/index.html`, templates[post.template](post))

  var outposts = JSON.parse(JSON.stringify(posts))
  outposts.forEach(d => delete d.html)
  fs.writeFileSync(public + '/posts.json', JSON.stringify(outposts, null, 2))


}
posts.forEach(writePost)

if (process.argv.includes('--watch')){
  require('chokidar').watch(source).on('change', path => {
    rsyncSource()
    if (path.includes('_posts/')) writePost(parsePost(path))
  })
}
