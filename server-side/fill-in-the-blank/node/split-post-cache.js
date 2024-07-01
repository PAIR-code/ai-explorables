import urlSlug from 'url-slug';

import ss from 'scrape-stl';
var {d3, jp, fs, io, _} = ss;

import {URL} from 'url';
var __dirname = new URL('.', import.meta.url).pathname;

var datadir = __dirname + '/../../../source/fill-in-the-blank/data/';
var postCache = io.readDataSync(datadir + 'post-cache.json');

var cacheKey2filename = {};
Object.entries(postCache).forEach(([key, value]) => {
  var filename = urlSlug(key) + '.json';
  io.writeDataSync(datadir + filename, value);
  cacheKey2filename[key] = filename;
});

fs.writeFileSync(
  datadir + 'cachekey2filename.js',
  `window.cacheKey2filename = ${JSON.stringify(cacheKey2filename, null, 2)}`,
);
