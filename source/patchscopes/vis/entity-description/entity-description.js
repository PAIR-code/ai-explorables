/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Visualize results of patching as a flat, explorable grid.
 */

import {ExperimentData} from '../../lib/experiment-data.js';
import {loadProgressUntil} from '../../lib/load-progress-until.js';

/**
 * CSS class to assign to container for styling.
 */
const ENTITY_DESCRIPTION_VIS_CLASS = 'entity-description-vis';
const TRUNCATE_INDEX = 10;
const r = 103;
const g = 24;
const b = 175;

const rowHeight = 32;
const headerHeight = 30;

/**
 * Flat grid visualization.
 *
 */
class EntityDescriptionVis {
  /**
   * @param {Fetcher} fetcher Shared caching Fetcher instance.
   */
  constructor(fetcher) {
    /**
     * Shared cacheing Fetcher instance.
     * @type {Fetcher}
     */
    this.fetcher = fetcher;

    /**
     * Container element into which to render. Supplied to `init()`.
     * @type {Element}
     * @see init()
     */
    this.containerElem = undefined;

    /**
     * Relative URL to JSON data. Supplied to `init()` via config.
     * @type {string}
     * @see init()
     */
    this.jsonDataUrl = undefined;

    /**
     * Experiment data parsed from fetched response.
     * @type {ExperimentData}
     * @see init()
     */
    this.experimentData = new ExperimentData();

    /**
     * Hovered token id.
     * @type {number}
     * @see setupVis()
     */
    this.hoveredTokenId = undefined;

    this.selectedExample = undefined;
    this.tooltips = undefined;
  }

  /**
   * Perform initialization specific to config.
   *
   * Example configuration JSON:
   *
   * ```
   * {
   *   "jsonDataUrl": "./data/flat_data.json"
   * }
   * ```
   *
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @param {number} configJson.jsonDataUrl URL to JSON data.
   * @throws {Error} If called more than once.
   * @throws {Error} If JSON data cannot be downloaded.
   */
  async init(containerElem, configJson) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }
    this.tooltips = configJson.tooltips;
    this.containerElem = containerElem;
    d3.select(this.containerElem).attr('class', 'single');

    // Check the config for required fields.
    const {jsonDataUrl} = configJson;
    if (!jsonDataUrl || typeof jsonDataUrl !== 'string') {
      throw new Error('jsonDataUrl field is missing');
    }
    this.jsonDataUrl = jsonDataUrl;

    // Set a CSS class on the container for styling.
    containerElem.classList.add(ENTITY_DESCRIPTION_VIS_CLASS);

    // Loading...
    await loadProgressUntil(
      this.containerElem,
      this.fetcher
        .fetch(jsonDataUrl)
        .then((response) => response.text())
        .then((stringData) => void this.setupData(stringData)),
    );

    // Once data is loaded and initialized, set up the visual elements.
    this.setupVis();
  }

  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  setupData(stringData) {
    this.experimentData.initFromString('[' + stringData + ']', true);
  }

  /**
   * Set up the visualization. Expects `setupData()` to have already been called
   * succesfully and ran to completion.
   * @see setupData()
   */
  setupVis() {
    d3.select(this.containerElem).classed('container', true);
    const annotations = d3
      .select(this.containerElem)
      .append('div')
      .attr('class', 'tooltip-section');
    const table = d3
      .select(this.containerElem)
      .append('div')
      .attr('class', 'table');

    annotations
      .selectAll('div')
      .data(d3.entries(this.tooltips))
      .enter()
      .append('div')
      .attr('class', 'tooltip-entity')
      .text((d) => d.value)
      .style(
        'top',
        (d) => headerHeight * 1.5 + rowHeight * Number(d.key) * 0.7 + 'px',
      );

    const tableContainer = table.append('div').classed('table-container', true);

    const headers = tableContainer.append('div').classed('headers', true);

    headers
      .selectAll('.cell')
      .data(['Source Layer', 'Evaluator Score', 'Generation'])
      .enter()
      .append('div')
      .classed('cell', true)
      .style('text-align', (d) =>
        d === 'Source Layer' || d === 'Evaluator Score' ? 'center' : 'left',
      )
      .style('justify-content', (d) =>
        d === 'Source Layer' || d === 'Evaluator Score' ? 'center' : 'left',
      )
      .text((d) => d);

    const rows = table
      .selectAll('.row')
      .data(this.experimentData.flatExperiments.splice(0, TRUNCATE_INDEX))
      .enter()
      .append('div')
      .attr('class', 'row default');

    const sourceLayers = rows
      .append('div')
      .classed('cell', true)
      .classed('source-cell', true)
      .text((d) => d['layer_source']);

    const scores = rows
      .append('div')
      .classed('token-container', true)
      .classed('cell', true)
      .classed('score-cell', true);

    scores
      .selectAll('.token')
      .data((d, i) => [
        this.parseScore(d['description_similarity_ratings_text']),
      ])
      .enter()
      .append('div')
      .classed('token', true)
      .classed('score-token', true)
      .style('background-color', (d) => {
        const score = d / 20;
        const red = 255 * (1 - score) + r * score;
        const green = 255 * (1 - score) + g * score;
        const blue = 255 * (1 - score) + b * score;
        return 'rgb(' + red + ', ' + green + ', ' + blue + ')';
      })
      .text((d, i) => d);

    const tokens = rows
      .append('div')
      .classed('cell', true)
      .classed('non-tokenized', true)
      .text((d) => d['generations_cropped']);
  }

  parseScore(scoreString) {
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const appears = values.filter((d) => scoreString.includes(d.toString()));
    return Math.max(...appears);
  }
}

/**
 * Factory function that returns a callback to register vis.
 * The returned callback function will construct and initialize a `FlatGridVis`.
 * @see FlatGridVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's an instance.
 */
export function entityDescriptionVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new EntityDescriptionVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
