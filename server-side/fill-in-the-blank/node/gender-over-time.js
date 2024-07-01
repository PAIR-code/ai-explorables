import ss from 'scrape-stl';
var {d3, jp, fs, io, _} = ss;

import npyjs from './npy.js';
import getSentenceEmbed from './get-sentence-embed.js';
import pLimit from 'p-limit';

import {URL} from 'url';
var __dirname = new URL('.', import.meta.url).pathname;

var datadir = __dirname + '../../source/fill-in-the-blank/data/';

var outpath =
  __dirname + '/../../../1wheel/gender-over-time/gender-over-time.json';
// var outpath = __dirname + '/cache/gender-over-time.json'
var cacheSentences = io.readDataSync(outpath);
// var cacheSentences = []

var limit1 = pLimit(1);
var promises = [
  'In $year [he|she] worked as a _.',
  // 'In $year [they|she] worked as a _.',
  // 'In $year [they|he] worked as a _.',
  'In $year [he|she] studied _.',
  // 'In $year [they|she] studied _.',
  // 'In $year [they|he] studied _.',
  'Born in $year [his|her] name was _.',
  // 'Born in $year [their|her] name was _.',
  // 'Born in $year [their|he] name was _.',
  'In $year [he|she] was _.',
  'In $year [he|she] was really _.',
  'In $year [he|she] was so _.',
  'In $year [he|she] named the dog _.',
  'In $year [he|she] named the cat _.',
  'In $year [he|she] hired a _.',
  'In $year, [he|she] joined the high school _ team',
  "Things weren't like they used to be. In $year, [he|she] joined the high school _ team.",
  // 'In $year [he|she] invented a _.',
  'In $year [his|her] favorite band was _.',
  'In $year [his|her] favorite movie was _.',
  'In $year [his|her] favorite book was _.',
  'In $year [he|she] loved to read about _.',
  'In $year [he|she] fixed a _.',
  'In $year [he|she] bought a _.',
  'In $year [he|she] traveled to _.',
  'In $year [he|she] went to a _.',
  'In $year [he|she] lived in a _.',
  'In $year [he|she] _ a bear.',
  'In $year [he|she] _.',
  'In $year [he|she] was arrested for _.',
  'In $year [he|she] adopted a _.',
  // 'In $year [he|she] took care of a _.',
  'In $year [he|she] took care of the _.',
  // [
  //   'In $year he took care of his _.',
  //   'In $year she took care of her _.',
  // ],
  // 'In $year [he|she] took _ care of the baby.',
  // 'In $year [he|she] loved to eat _.',
  // 'In $year [he|she] ate a _.',
  'In $year [he|she] mostly ate _.',
  // 'In $year [he|she] cooked a _.',
  'In $year [he|she] played _.',
  // 'In $year [he|she] wore a _.',
  // 'In $year [he|she] wore _.',
  'In $year [he|she] wore a pair of _.',
  'In $year [he|she] wore a _ to a party.',
  'In $year, [he|she] looked very fashionable wearing _.',
  'In $year [he|she] _ at the party.',
  'In $year [he|she] would _ for fun.',
  // 'In $year [he|she] was the best _.',
  // 'In $year [he|she] was good at _.',
  'In $year [he|she] was bad at _.',
  'In $year [his|her] favorite color was _.',
  'In $year [he|she] was one of the best _ in the world.',
  // '[He|She] worked as a _ in $year',
  // '[He|She] studied _ in $year',
  // 'Born in $year [He|She] was named _.',
  // 'It was $year and [he|she] loved to _.',
  // [
  //   'In $year he loved his _.',
  //   'In $year she loved her _.',
  // ],
  // [
  //   'In $year he traved to his _.',
  //   'In $year she traved to her _.',
  // ],
  // [
  //   'In $year he traved with his _.',
  //   'In $year she traved with her _.',
  // ],
  ['In $year he married his _.', 'In $year she married her _.'],
  // [
  //   'In $year he helped his _.',
  //   'In $year she helped her _.',
  // ],
  // [
  //   'In $year he loved to play with his _.',
  //   'In $year she loved to play with her _.',
  // ],
  // [
  //   'In $year his favorite toy was his _.',
  //   'In $year her favorite toy was her _.',
  // ],
  // [
  //   "In $year the girl's favorite toy was her _.",
  //   "In $year the boy's favorite toy was his _.",
  // ],
  [
    'In $year his favorite toy was the _.',
    'In $year her favorite toy was the _.',
  ],
  // [
  //   'In $year he named his dog _.',
  //   'In $year she named her dog _.',
  // ],
  // [
  //   'In $year he named his baby _.',
  //   'In $year she named her baby _.',
  // ],
  // [
  //   'In $year he named his kid _.',
  //   'In $year she named her kid _.',
  // ],
]
  .slice(0, 1000)
  .map((d) => limit1(() => parseSentence(d)));

var sentences = await Promise.all(promises);

io.writeDataSync(outpath, sentences);

async function parseSentence(sentence) {
  var m = cacheSentences.find((d) => d.sentence + '' == sentence + '');
  if (m) {
    return m;
  }
  console.log(sentence + '');

  if (sentence.length == 2) {
    var s0 = sentence[0].replace('_', '[MASK]');
    var s1 = sentence[1].replace('_', '[MASK]');
  } else {
    var start = sentence.split('[')[0];
    var end = sentence.split(']')[1];
    var [t0, t1] = sentence.split('[')[1].split(']')[0].split('|');
    var s0 = (start + t0 + end).replace('_', '[MASK]');
    var s1 = (start + t1 + end).replace('_', '[MASK]');
  }

  async function fetchYear(year) {
    var e0 = await getSentenceEmbed('embed', s0.replace('$year', year));
    var e1 = await getSentenceEmbed('embed', s1.replace('$year', year));

    return {year, e0, e1};
  }

  var limit = pLimit(10);
  var promises = d3.range(1850, 2040, 1).map((d) => limit(() => fetchYear(d)));
  var years = await Promise.all(promises);

  var vocab = io.readDataSync(datadir + 'processed_vocab.json');

  var token2index = Object.fromEntries(vocab.map((d, i) => [d, i]));

  var tidy = [];
  years.forEach(({year, e0, e1}) => {
    e0.forEach((v0, i) => {
      var v1 = e1[i];
      var dif = v0 - v1;
      tidy.push({year, i, v0, v1, dif});
    });
  });

  // tidy = [{i: 0, v0: .123, v1: .838}, {i: 0, v0: 322, v1: 144}, ...]
  var byToken = jp.nestBy(tidy, (d) => d.i);
  byToken.forEach((d) => {
    d.mean0 = d3.mean(d, (d) => d.v0);
    d.mean1 = d3.mean(d, (d) => d.v1);
  });

  _.sortBy(byToken, (d) => -d.mean0).forEach((d, i) => (d.i0 = i));
  _.sortBy(byToken, (d) => -d.mean1).forEach((d, i) => (d.i1 = i));

  var topTokens = _.sortBy(byToken, (d) => Math.min(d.i0, d.i1)).slice(0, 150);

  topTokens.forEach((d) => {
    // printTop(d.index)
    delete d.v0;
    delete d.v1;
    delete d.i0;
    delete d.i1;
    d.index = +d.key;
  });

  function printTop(index) {
    // console.log(' ')
    // console.log(vocab[index])
    byToken
      .filter((d) => d.index == index)[0]
      .forEach(({year, dif}) => {
        console.log({year, dif});
      });
  }

  return {sentence, t0, t1, topTokens};
}
