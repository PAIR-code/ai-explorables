/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Class for processing experiment data.
 */

import {Vocab} from './vocab.js';

/**
 * Parses and processes raw experiment data.
 */
export class ExperimentData {
  constructor() {
    /**
     * Vocab mapping token ids to token strings.
     * @type {Vocab}
     */
    this.vocab = new Vocab();

    /**
     * List of flat experiments.
     * @type {Object[]}
     * @see init()
     */
    this.flatExperiments = undefined;

    /**
     * Index from source layer number to flat experiments.
     * @type {Set<number, Object[]>}
     * @see init()
     */
    this.sourceLayerIndex = undefined;

    /**
     * Index from source position number to flat experiments.
     * @type {Set<number, Object[]>}
     * @see init()
     */
    this.sourcePositionIndex = undefined;

    /**
     * Index from target layer number to flat experiments.
     * @type {Set<number, Object[]>}
     * @see init()
     */
    this.targetLayerIndex = undefined;

    /**
     * Index from target position number to flat experiments.
     * @type {Set<number, Object[]>}
     * @see init()
     */
    this.targetPositionIndex = undefined;

    /**
     * Index from max generation length to flat experimets.
     * @type {Set<number, Object[]>}
     * @see init()
     */
    this.maxGenLenIndex = undefined;

    /**
     * Index from num layers to flat experimets.
     * @type {Set<number, Object[]>}
     * @see init()
     */
    this.numLayersIndex = undefined;

    /**
     * Index from model name to flat experimets.
     * @type {Set<number, Object[]>}
     * @see init()
     */
    this.modelNameIndex = undefined;
  }

  /**
   * Initialize from an array of flat experimets.
   * @param {Object[]} flatExperimetns Parsed, flat experiment data.
   */
  init(flatExperiments, reformat) {
    if (this.flatExperiments) {
      throw new Error('already initialized');
    }

    this.flatExperiments = reformat
      ? this.reformat(flatExperiments)
      : flatExperiments;

    for (let i = 0; i < this.flatExperiments.length; i++) {
      const flatExperiment = this.flatExperiments[i];
      if (!flatExperiment) {
        throw new Error('flatExperiment missing');
      }

      // Hand-crafted experiment data may lack token ids.
      if ('prompt_source_ids' in flatExperiment) {
        this.vocab.addAll(
          flatExperiment['prompt_source_ids'],
          flatExperiment['tokenized_source'],
        );
      }
      if ('prompt_target_ids' in flatExperiment) {
        this.vocab.addAll(
          flatExperiment['prompt_target_ids'],
          flatExperiment['tokenized_target'],
        );
      }
      if ('generated_tok_ids' in flatExperiment) {
        this.vocab.addAll(
          flatExperiment['generated_tok_ids'],
          flatExperiment['generated_toks'],
        );
      }
    }

    this.sourceLayerIndex = createIndexMap(
      this.flatExperiments,
      (flatExperiment) => [flatExperiment['layer_source']],
    );

    this.sourcePositionIndex = createIndexMap(
      this.flatExperiments,
      (flatExperiment) => [flatExperiment['position_source']],
    );

    this.targetLayerIndex = createIndexMap(
      this.flatExperiments,
      (flatExperiment) => [flatExperiment['layer_target']],
    );

    this.targetPositionIndex = createIndexMap(
      this.flatExperiments,
      (flatExperiment) => [flatExperiment['position_target']],
    );

    this.maxGenLenIndex = createIndexMap(
      this.flatExperiments,
      (flatExperiment) => [flatExperiment['max_gen_len']],
    );

    this.numLayersIndex = createIndexMap(
      this.flatExperiments,
      (flatExperiment) => [flatExperiment['num_layers']],
    );

    this.modelNameIndex = createIndexMap(
      this.flatExperiments,
      (flatExperiment) => [flatExperiment['model']],
    );
  }

  /**
   * Attempt to parse and process a raw string of incoming experiment data. That
   * data may be double-encoded.
   * @see parseExperimentData()
   * @param {string} stringData Raw incoming string data to parse and process.
   */
  initFromString(stringData, reformat = false) {
    const flatExperiments = parseExperimentData(stringData);
    this.init(flatExperiments, reformat);
  }
  reformat(flatExperiments) {
    const newFlatExperiments = [];
    for (let i = 0; i < 40; i++) {
      newFlatExperiments.push({});
    }
    for (const key in flatExperiments[0]) {
      for (const layer in flatExperiments[0][key]) {
        newFlatExperiments[layer][key] = flatExperiments[0][key][layer];
      }
    }
    return newFlatExperiments;
  }
}

/**
 * Attempt to parse a raw string of incoming experiment data. That data may be
 * double-encoded.
 * @param {string} stringData Raw incoming string data to parse and process.
 * @return {Object[]} Array of flat experiment objects.
 * @throws {Error} If string fails to decode at all.
 * @throws {Error} If string decodes to a string that fails to decode.
 * @throws {Error} If string decodes to any type other than string or Array.
 */
export function parseExperimentData(stringData) {
  let parsedData = JSON.parse(stringData);
  if (typeof parsedData === 'string') {
    // NOTE: Flat data is sometimes double-encoded.
    parsedData = JSON.parse(parsedData);
  }
  if (!Array.isArray(parsedData)) {
    throw new Error('decoded object is not an array');
  }
  return parsedData;
}

/**
 * Given an array of objects, use the valuesFn callback to produce an array of
 * values for each (may be empty). Use those values to create a Map from values
 * to arrays of indices of matching objects.
 * @param {Object[]} objects Array of objects to index.
 * @param {Function} valuesFn Accessor returning an array of values .
 * @returns Mapping from values to indices of matching objects.
 */
function createIndexMap(objects, valuesFn) {
  const valueToIndicesMap = new Map();
  for (let i = 0; i < objects.length; i++) {
    const values = valuesFn(objects[i]);
    for (const value of values) {
      let indicesList = valueToIndicesMap.get(value);
      if (!indicesList) {
        indicesList = [];
        valueToIndicesMap.set(value, indicesList);
      }
      indicesList.push(i);
    }
  }
  return valueToIndicesMap;
}
