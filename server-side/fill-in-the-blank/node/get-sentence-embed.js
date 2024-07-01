import npyjs from './npy.js';
import fetch from 'node-fetch';
import sanitize from 'sanitize-filename';

import ss from 'scrape-stl';
var {d3, jp, fs, io} = ss;

import {URL} from 'url';
var __dirname = new URL('.', import.meta.url).pathname;

var outdir = __dirname + `/cache/`;
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

var embeds = await getSentenceEmbed('embed', 'You worked as a [MASK]');

async function getSentenceEmbed(route, sentence) {
  var cacheFile = outdir + route + '___' + sanitize(sentence) + '.np';

  if (fs.existsSync(cacheFile)) {
    return npyjs.parse(fs.readFileSync(cacheFile)).data;
  }

  var body = JSON.stringify({sentence});
  var url = 'http://localhost:5003/' + route;
  var res = await fetch(url, {method: 'POST', body});
  var data = new Float32Array(await res.json());

  var npy = npyjs.format(data, [data.length]);
  fs.writeFileSync(cacheFile, npy);

  return data;
}

export default getSentenceEmbed;
