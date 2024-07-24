/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Simple visualization of a tranformer model.
 */

import {ExperimentData} from '../../lib/experiment-data.js';
import {arraysEqual} from '../../lib/arrays-equal.js';
import {getContentsRect} from '../../lib/get-contents-rect.js';
import {loadProgressUntil} from '../../lib/load-progress-until.js';

/**
 * CSS class to assign to container for styling.
 */
const SIMPLE_TRANSFORMER_VIS_CLASS = 'simple-transformer-vis';

/**
 * Default margin values in pixels to use if unspecified by config.
 */
const DEFAULT_MARGIN_PX = {
  bottom: 20,
  left: 20,
  right: 20,
  top: 20,
};

/**
 * Default height to space network layers.
 */
const DEFAULT_LAYER_HEIGHT_PX = 8;

/**
 * Default angle to rotate tokens in radians.
 */
const DEFAULT_TOKEN_ANGLE_RAD = -90;

/**
 * Default width to give to tokens in pixels.
 */
const DEFAULT_TOKEN_WIDTH_PX = 16;

/**
 * Default radius of network dots in pixels.
 */
const DEFAULT_NETWORK_DOT_RADIUS_PX = 2;

/**
 * Default color to render network dots.
 */
const DEFAULT_NETWORK_DOT_COLOR = 'rgba(0 0 0 / 20%)';

/**
 * Simple transformer visualization.
 *
 */
class SimpleTransformerVis {
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
     * Selected source prompt, as expressed as an array of token ids. Loaded
     * experiment data may have only a single source prompt to choose from.
     * @type {number[]}
     * @see init()
     */
    this.selectedSourceTokenIds = undefined;

    /**
     * Configurable margin between edge of vis contents and SVG boundary.
     * @type {Object}
     * @see init()
     */
    this.margin = undefined;

    /**
     * Configurable height of network layer in pixels.
     * @type {number}
     * @see init()
     */
    this.layerHeight = undefined;

    /**
     * Configurable color to render network dots.
     * @type {string}
     * @see init()
     */
    this.networkDotColor = undefined;

    /**
     * Configurable radius of network dots in pixels.
     * @type {number}
     * @see init()
     */
    this.networkDotRadius = undefined;

    /**
     * Configurable angle to rotate tokens in radians.
     * @type {number}
     * @see init()
     */
    this.tokenAngle = undefined;

    /**
     * Configurable width of rendered tokens in pixels.
     * @type {number}
     * @see init()
     */
    this.tokenWidth = undefined;

    /**
     * D3 selection housing the injected `<svg>` element for visualizing.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.svgSel = undefined;

    /**
     * D3 selection housing the injected root `<g>` element that contains all
     * descendant elements. This allows us to place elements, then transform the
     * root to make everything visible.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.rootGroupSel = undefined;

    /**
     * D3 selection housing the injected `<g>` element containing source token
     * text.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.sourceTokensGroupSel = undefined;

    /**
     * D3 selection housing the injected `<g>` element containing dots that
     * represent network nodes.
     * @type {d3.Selection}
     */
    this.networkDotsGroupSel = undefined;

    /**
     * D3 linear scale for positioning source tokens and related elements.
     * @type {d3.Scale}
     */
    this.sourceTokensScale = d3.scaleLinear();

    /**
     * D3 linear scale for positioning network dots and related elements based
     * on the source layer.
     * @type {d3.Scale}
     */
    this.sourceLayersScale = d3.scaleLinear();
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
   * @param {number} configJson.layerHeight Optional height of network layers.
   * @param {Object} configJson.margin Optional margin object.
   * @param {number} configJson.margin.bottom Optional bottom margin in pixels.
   * @param {number} configJson.margin.left Optional left margin in pixels.
   * @param {number} configJson.margin.right Optional right margin in pixels.
   * @param {number} configJson.margin.top Optional top margin in pixels.
   * @param {string} configJson.networkDotColor Optional color of network dot.
   * @param {number} configJson.networkDotRadius Optional radius of network dot.
   * @param {number} configJson.tokenWidth Optional width of tokens.
   * @throws {Error} If called more than once.
   * @throws {Error} If JSON data cannot be downloaded.
   */
  async init(containerElem, configJson) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }
    this.containerElem = containerElem;

    // Check the config for required fields.
    const {jsonDataUrl} = configJson;
    if (!jsonDataUrl || typeof jsonDataUrl !== 'string') {
      throw new Error('jsonDataUrl field is missing');
    }
    this.jsonDataUrl = jsonDataUrl;

    // Check config for optional fields.
    const {margin} = configJson;
    this.margin = {
      bottom: margin?.bottom ?? DEFAULT_MARGIN_PX.bottom,
      left: margin?.left ?? DEFAULT_MARGIN_PX.left,
      right: margin?.right ?? DEFAULT_MARGIN_PX.right,
      top: margin?.top ?? DEFAULT_MARGIN_PX.top,
    };

    this.layerHeight = configJson.layerHeight ?? DEFAULT_LAYER_HEIGHT_PX;
    this.networkDotColor =
      configJson.networkDotColor ?? DEFAULT_NETWORK_DOT_COLOR;
    this.networkDotRadius =
      configJson.networkDotRadius ?? DEFAULT_NETWORK_DOT_RADIUS_PX;
    this.tokenAngle = configJson.tokenAngle ?? DEFAULT_TOKEN_ANGLE_RAD;
    this.tokenWidth = configJson.tokenWidth ?? DEFAULT_TOKEN_WIDTH_PX;

    // Set a CSS class on the container for styling.
    containerElem.classList.add(SIMPLE_TRANSFORMER_VIS_CLASS);

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
    this.experimentData.initFromString(stringData);

    // Select the first experiment's source tokens by default.
    this.selectedSourceTokenIds = [
      ...this.experimentData.flatExperiments[0]['prompt_source_ids'],
    ];
  }

  /**
   * Set up the visualization. Expects `setupData()` to have already been called
   * succesfully and ran to completion.
   * @see setupData()
   */
  setupVis() {
    // Setup selections.
    this.svgSel = d3.select(this.containerElem).append('svg');
    this.rootGroupSel = this.svgSel.append('g');

    this.networkDotsGroupSel = this.rootGroupSel
      .append('g')
      .classed('network-dots', true);

    this.sourceTokensGroupSel = this.rootGroupSel
      .append('g')
      .classed('source-tokens', true)
      .attr('transform', 'translate(0,10)');

    this.update();
  }

  /**
   * Update visualization elements in response to user interaction.
   */
  update() {
    // First, update scales.
    this.sourceTokensScale
      .domain([0, this.selectedSourceTokenIds.length])
      .range([
        this.margin.left,
        this.margin.left + this.selectedSourceTokenIds.length * this.tokenWidth,
      ]);

    const selectedExperiments = this.experimentData.flatExperiments.filter(
      (flatExperiment) =>
        arraysEqual(
          flatExperiment['prompt_source_ids'],
          this.selectedSourceTokenIds,
        ),
    );
    const sourceLayerExtent = d3.extent(
      selectedExperiments,
      (flatExperiment) => flatExperiment['layer_source'],
    );

    this.sourceLayersScale
      .domain(sourceLayerExtent)
      .range([0, -sourceLayerExtent[1] * this.layerHeight]);

    this.updateSourceTokens();
    this.updateNetworkDots();

    this.fitToContents();
  }

  /**
   * Update source tokens portion of the visualization. Called by `update()`.
   * @see update()
   */
  updateSourceTokens() {
    const sourceTokensUpdateSel = this.sourceTokensGroupSel
      .selectAll('.token')
      .data(this.selectedSourceTokenIds);

    const sourceTokensEnterSel = sourceTokensUpdateSel
      .enter()
      .append('g')
      .classed('token', true);

    sourceTokensEnterSel.append('text');

    sourceTokensEnterSel
      .merge(sourceTokensUpdateSel)
      .attr(
        'transform',
        (_, index) => `translate(${this.sourceTokensScale(index)},0)`,
      )
      .select('text')
      .attr('alignment-baseline', 'middle')
      .attr('text-anchor', 'end')
      .attr('transform', `rotate(${this.tokenAngle})`)
      .text((id) => this.experimentData.vocab.getString(id));
  }

  /**
   * Update network dots portion of the visualization. Called by `update()`.
   * @see update()
   */
  updateNetworkDots() {
    // Array of sourceTokenIndex/sourceLayerIndex coordinate pairs.
    const networkDotsData = d3
      .cross(
        d3.range(0, this.selectedSourceTokenIds.length),
        d3.range(...this.sourceLayersScale.domain()),
      )
      .map(([sourceTokenIndex, sourceLayerIndex]) => ({
        sourceTokenIndex,
        sourceLayerIndex,
      }));

    const networkDotsUpdateSel = this.networkDotsGroupSel
      .selectAll('circle')
      .data(networkDotsData);

    const networkDotsEnterSel = networkDotsUpdateSel.enter().append('circle');

    networkDotsEnterSel
      .merge(networkDotsUpdateSel)
      .attr('fill', this.networkDotColor)
      .attr('r', this.networkDotRadius)
      .attr('cx', ({sourceTokenIndex}) =>
        this.sourceTokensScale(sourceTokenIndex),
      )
      .attr('cy', ({sourceLayerIndex}) =>
        this.sourceLayersScale(sourceLayerIndex),
      );
  }

  /**
   * Stretch the visualization SVG to fit its contents, and transform the root
   * group element to align with specified margin.
   */
  fitToContents() {
    // Stretch SVG element to fit contents plus room for margins.
    const svgNode = this.svgSel.node();
    const svgRect = svgNode.getBoundingClientRect();
    const contentsRect = getContentsRect(svgNode);
    const fullHeight =
      contentsRect.height + this.margin.bottom + this.margin.top;
    const fullWidth = contentsRect.width + this.margin.left + this.margin.right;
    this.svgSel.attr('height', fullHeight).attr('width', fullWidth);

    // Shift root group element to align with SVG, plus margins.
    //
    // Example showing hypothetical top-left corner of SVG at (90,30) and two
    // hypothetical top-left corners of the contents rect at (60,100) and (150,
    // 150).
    //
    // ```
    //   ......................................................................
    //   .
    //   .
    //   .              svg (90, 30)
    //   .                  +----------------------------------------------
    //   .                  | offset: (svg.x - cr.x, svg.y - cr.y)
    //   .                  |
    //   .                  |
    //   .          *       |
    //   .  cr (60, 100)    |
    //   .                  |
    //   .                  |
    //   .                  |                 *
    //   .                  |            cr (150, 150)
    //   .                  |
    // ```
    const offsetLeft = svgRect.left - contentsRect.left + this.margin.left;
    const offsetTop = svgRect.top - contentsRect.top + this.margin.top;
    this.rootGroupSel.attr(
      'transform',
      `translate(${offsetLeft}, ${offsetTop})`,
    );
  }
}

/**
 * Factory function that returns a callback to register vis. The returned
 * callback function will construct and initialize a `SimpleTransformerVis`.
 * @see SimpleTransformerVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's an instance.
 */
export function simpleTransformerVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new SimpleTransformerVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
