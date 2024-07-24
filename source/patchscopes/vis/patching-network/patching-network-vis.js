/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Vis test harness for `PatchingNetwork`.
 */

import {getContentsRect} from '../../lib/get-contents-rect.js';
import {getRenderableKey} from './renderables/renderable.js';
import {PatchingNetwork} from './patching-network.js';

/**
 * CSS class to assign to container for styling.
 */
const PATCHING_NETWORK_VIS_CLASS = 'patching-network-vis';

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
 * Example network data. Will be replaced by dynamic later.
 */
const EXAMPLE_NETWORK_DATA = {
  numLayers: 40,
  skipLayersConfig: [[6, 38]],
  showArrows: {
    inputTokenToEmbedding: true,
    embeddingToLayer: true,
    layerToNextLayer: true,
    layerToLaterToken: true,
    layerToUnembedding: true,
    unembeddingToOutputToken: true,
  },
  networks: [
    {
      rows: [
        {inputToken: 'twinkle', positionIndex: 0},
        {inputToken: 'twinkle', positionIndex: 1},
        {inputToken: 'little', positionIndex: 2, outputToken: 'star'},
        {positionIndex: 3, outputToken: 'how'},
        {positionIndex: 4, outputToken: 'I'},
        {positionIndex: 5, outputToken: 'wonder'},
      ],
    },
  ],
  patches: [],
};

/**
 * Transformer patching network TEST visualization.
 */
class PatchingNetworkVis {
  constructor() {
    /**
     * Container element into which to render. Supplied to `init()`.
     * @type {Element}
     * @see init()
     */
    this.containerElem = undefined;

    /**
     * Configurable margin between edge of vis contents and SVG boundary.
     * @type {Object}
     * @see init()
     */
    this.margin = undefined;

    /**
     * Patching network instance for this test harness. Created in `init()`.
     * @type {PatchingNetwork}
     * @see init()
     */
    this.patchingNetwork = undefined;

    /**
     * D3 selection housing the injected `<svg>` element for visualizing.
     * @type {d3.Selection}
     */
    this.svgSel = undefined;

    /**
     * D3 selection housing the injected root `<g>` element that contains all
     * descendant elements. This allows us to place elements, then transform the
     * root to make everything visible.
     * @type {d3.Selection}
     */
    this.rootGroupSel = undefined;
  }

  /**
   * Perform initialization specific to config.
   *
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @throws {Error} If called more than once.
   * @throws {Error} If JSON data cannot be downloaded.
   */
  async init(containerElem, configJson) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }

    this.containerElem = containerElem;
    this.containerElem.classList.add(PATCHING_NETWORK_VIS_CLASS);

    // Check config for optional fields.
    const {margin} = configJson;
    this.margin = {
      bottom: margin?.bottom ?? DEFAULT_MARGIN_PX.bottom,
      left: margin?.left ?? DEFAULT_MARGIN_PX.left,
      right: margin?.right ?? DEFAULT_MARGIN_PX.right,
      top: margin?.top ?? DEFAULT_MARGIN_PX.top,
    };

    const patchingNetwork = new PatchingNetwork();
    this.patchingNetwork = patchingNetwork;

    patchingNetwork.numLayers = EXAMPLE_NETWORK_DATA.numLayers;
    patchingNetwork.skipLayersConfig = EXAMPLE_NETWORK_DATA.skipLayersConfig;
    patchingNetwork.networkTokenRows = EXAMPLE_NETWORK_DATA.networks.map(
      ({rows}) => rows,
    );

    // TODO(jimbo): Make these configurable.
    [
      patchingNetwork.inputTokenColumnConfigTemplate,
      patchingNetwork.hiddenStateVectorColumnConfigTemplate,
      patchingNetwork.outputTokenColumnConfigTemplate,
    ].forEach((columnConfigTemplate) => {
      columnConfigTemplate.marginLeft = 14;
      columnConfigTemplate.marginRight = 14;
      columnConfigTemplate.paddingLeft = 5; // Space for arrow heads.
      columnConfigTemplate.paddingRight = 2;
      columnConfigTemplate.width = 14;
    });

    [
      patchingNetwork.embeddingColumnConfigTemplate,
      patchingNetwork.unembeddingColumnConfigTemplate,
    ].forEach((columnConfigTemplate) => {
      columnConfigTemplate.marginLeft = 14;
      columnConfigTemplate.marginRight = 14;
      columnConfigTemplate.paddingLeft = 5; // Space for arrow heads.
      columnConfigTemplate.paddingRight = 2;
      columnConfigTemplate.width = 10;
    });

    [patchingNetwork.skippedLayersColumnConfigTemplate].forEach(
      (columnConfigTemplate) => {
        columnConfigTemplate.marginLeft = 20;
        columnConfigTemplate.marginRight = 20;
        columnConfigTemplate.paddingLeft = 11; // Space for arrow heads.
        columnConfigTemplate.paddingRight = 8;
        columnConfigTemplate.width = 16;
      },
    );

    patchingNetwork.networkRowConfigTemplate.height = 14;
    patchingNetwork.networkRowConfigTemplate.marginTop = 12;
    patchingNetwork.networkRowConfigTemplate.marginBottom = 12;

    patchingNetwork.networkConfigTemplate.marginBottom = 10;

    for (const patch of EXAMPLE_NETWORK_DATA.patches) {
      patchingNetwork.addPatch(patch);
    }

    patchingNetwork.update();

    const renderables = [...patchingNetwork.renderables.values()];

    this.svgSel = d3.select(this.containerElem).append('svg');

    this.rootGroupSel = this.svgSel.append('g');

    const renderablesUpdateSel = this.rootGroupSel
      .selectAll('g[data-key]')
      .data(renderables, getRenderableKey);

    const renderablesEnterSel = renderablesUpdateSel
      .enter()
      .append('g')
      .attr('data-key', (renderable) => renderable.getKey())
      .each((renderable, index, nodes) => {
        renderable.enter(nodes[index]);
      });

    renderablesEnterSel
      .merge(renderablesUpdateSel)
      .each((renderable, index, nodes) => {
        renderable.update(nodes[index]);
      });

    renderablesUpdateSel.exit().each((renderable, index, nodes) => {
      renderable.exit(nodes[index]);
    });

    this.fitToContents();
  }

  /**
   * Stretch the visualization SVG to fit its contents, and transform the root
   * group element to align with specified margin.
   */
  fitToContents() {
    // Determine SVG bounding rect.
    const svgNode = this.svgSel.node();
    const svgRect = svgNode.getBoundingClientRect();

    // Determine root node's bounding rect and its contents bounding rect.
    const rootNode = this.rootGroupSel.node();
    const rootRect = rootNode.getBoundingClientRect();
    const rootContentsRect = getContentsRect(rootNode);

    // Compute the current offset left and top values.
    const currentOffsetLeft = +this.rootGroupSel.attr('data-offset-left');
    const currentOffsetTop = +this.rootGroupSel.attr('data-offset-top');

    // Compute the left, top, width and height of the root contents, adjusting
    // for the current offset.
    const contentsLeft =
      (isNaN(rootContentsRect.left) ? rootRect.left : rootContentsRect.left) -
      currentOffsetLeft;
    const contentsTop =
      (isNaN(rootContentsRect.top) ? rootRect.top : rootContentsRect.top) -
      currentOffsetTop;
    const contentsHeight = isFinite(rootContentsRect.height)
      ? rootContentsRect.height
      : 0;
    const contentsWidth = isFinite(rootContentsRect.width)
      ? rootContentsRect.width
      : 0;

    // Stretch SVG element to fit contents plus room for margins.
    const fullHeight = contentsHeight + this.margin.bottom + this.margin.top;
    const fullWidth = contentsWidth + this.margin.left + this.margin.right;
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
    const offsetLeft = svgRect.left - contentsLeft + this.margin.left;
    const offsetTop = svgRect.top - contentsTop + this.margin.top;
    this.rootGroupSel
      .attr('data-offset-left', offsetLeft)
      .attr('data-offset-top', offsetTop)
      .attr('transform', `translate(${offsetLeft}, ${offsetTop})`);
  }
}

/**
 * Factory function that returns a callback to register vis. The returned
 * callback function will construct and initialize a `PatchingNetworkVis`.
 * @see PatchingNetworkVis.
 * @param {Element} containerElem Container element into which to render.
 * @param {Object} configJson Configuration JSON object.
 * @return {Promise} Async result of calling instance's `init()`.
 */
export function patchingNetworkVis(containerElem, configJson) {
  const vis = new PatchingNetworkVis();
  return vis.init(containerElem, configJson);
}
