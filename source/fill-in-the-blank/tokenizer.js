/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

// https://github.com/tensorflow/tfjs-models/blob/master/universal-sentence-encoder/src/tokenizer/trie.ts

class TrieNode {
  constructor(key) {
    this.key = key;
    this.parent = null;
    this.children = {};
    this.end = false;
  }

  getWord() {
    const output = [];
    let node = this;

    while (node !== null) {
      if (node.key !== null) {
        output.unshift(node.key);
      }
      node = node.parent;
    }

    return [output, this.score, this.index];
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode(null);
  }

  insert(word, score, index) {
    let node = this.root;

    const symbols = [];
    for (const symbol of word) {
      symbols.push(symbol);
    }

    for (let i = 0; i < symbols.length; i++) {
      if (!node.children[symbols[i]]) {
        node.children[symbols[i]] = new TrieNode(symbols[i]);
        node.children[symbols[i]].parent = node;
      }

      node = node.children[symbols[i]];

      if (i === symbols.length - 1) {
        node.end = true;
        node.score = score;
        node.index = index;
      }
    }
  }

  find(ss) {
    let node = this.root;
    let iter = 0;

    while (iter < ss.length && node != null) {
      node = node.children[ss[iter]];
      iter++;
    }

    return node;
  }
}

const bert = {
  loadTokenizer: async () => {
    const tokenizer = new BertTokenizer();
    await tokenizer.load();

    return tokenizer;
  },
};

class BertTokenizer {
  constructor() {
    this.separator = '\u2581';
    this.UNK_INDEX = 100;
  }

  async load() {
    this.vocab = await this.loadVocab();

    this.trie = new Trie();
    // Actual tokens start at 999.
    for (let i = 999; i < this.vocab.length; i++) {
      const word = this.vocab[i];
      this.trie.insert(word, 1, i);
    }

    this.token2Id = {};
    this.vocab.forEach((d, i) => {
      this.token2Id[d] = i;
    });

    this.decode = (a) => a.map((d) => this.vocab[d].replace('▁', ' ')).join('');
    // Adds [CLS] and [SEP]
    this.tokenizeCLS = (str) => [101, ...this.tokenize(str), 102];
  }

  async loadVocab() {
    if (!window.bertProcessedVocab) {
      window.bertProcessedVocab = await (
        await fetch('data/processed_vocab.json')
      ).json();
    }
    return window.bertProcessedVocab;
  }

  processInput(text) {
    const words = text.split(' ');
    return words.map((word) => {
      if (word !== '[CLS]' && word !== '[SEP]') {
        return this.separator + word.toLowerCase().normalize('NFKC');
      }
      return word;
    });
  }

  tokenize(text) {
    // Source:
    // https://github.com/google-research/bert/blob/88a817c37f788702a363ff935fd173b6dc6ac0d6/tokenization.py#L311

    let outputTokens = [];

    const words = this.processInput(text);

    for (let i = 0; i < words.length; i++) {
      const chars = [];
      for (const symbol of words[i]) {
        chars.push(symbol);
      }

      let isUnknown = false;
      let start = 0;
      const subTokens = [];

      const charsLength = chars.length;

      while (start < charsLength) {
        let end = charsLength;
        let currIndex;

        while (start < end) {
          let substr = chars.slice(start, end).join('');

          const match = this.trie.find(substr);

          if (match != null && match.end) {
            currIndex = match.getWord()[2];
            break;
          }

          end = end - 1;
        }

        if (currIndex == null) {
          isUnknown = true;
          break;
        }

        subTokens.push(currIndex);
        start = end;
      }

      if (isUnknown) {
        outputTokens.push(this.UNK_INDEX);
      } else {
        outputTokens = outputTokens.concat(subTokens);
      }
    }

    return outputTokens;
  }
}
