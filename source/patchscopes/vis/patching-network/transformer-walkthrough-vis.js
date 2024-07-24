/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Shows a step-by-step walkthrough of how transformers work.
 */

import {getRenderableKey} from './renderables/renderable.js';
import {PatchingNetwork} from './patching-network.js';
import {ExperimentData} from '../../lib/experiment-data.js';
import {loadProgressUntil} from '../../lib/load-progress-until.js';
import {fitToContents} from '../../lib/fit-to-contents.js';
import {CallbackStoryScene} from '../../lib/callback-story-scene.js';
import {foldNetworkRows} from './lib/fold-network-rows.js';
import {SequenceStoryScene} from '../../lib/sequence-story-scene.js';
import {StoryScene} from '../../lib/story-scene.js';
import {applyBasis} from '../../lib/apply-basis.js';

/**
 * CSS classes to assign to container for styling.
 */
const TRANSFORMER_WALKTHROUGH_VIS_CLASSES = [
  'patching-network-vis',
  'transformer-walkthrough-vis',
];

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
 * Bottom and top proportions between which the scroll should start/complete.
 */
const DEFAULT_SCROLL_THRESHOLD_PROPORTIONS = [0.25, 0.75];

/**
 * Walkthrough vis explaining how transformers work in steps.
 */
class TransformerWalkthroughVis {
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
     * Configurable margin between edge of vis contents and SVG boundary.
     * @type {Object}
     * @see init()
     */
    this.margin = undefined;

    /**
     * Experiment data parsed from fetched response.
     * @type {ExperimentData}
     * @see init()
     */
    this.experimentData = new ExperimentData();

    /**
     * Index within the experiment data to use for the walkthrough.
     * @type {number}
     */
    this.experimentIndex = undefined;

    /**
     * Selection holding the fixed position element injected into the container
     * to hold all content. Its `top` and `bottom` style attributeswill be
     * dynamically set in response to user scrolling.
     * @type {d3.Selection}
     * @see setupContent()
     */
    this.contentSel = undefined;

    /**
     * Handle returned by `requestAnimationFrame()` set when user scrolls.
     * @type {number|undefined}
     */
    this.frameHandle = undefined;

    /**
     * Offset top of the content `<div>` relative to the statically positioned
     * container. Effectively, this is how many pixels of progress have been
     * made into the story. Used to determine which stage of the story to
     * display.
     * @type {number|undefined}
     */
    this.offsetTop = undefined;

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

    /**
     * Object for debouncing visibility changes of nodes during scroll. Merged
     * (enter/update) elements need to have the CSS class `visible` set to true,
     * while exiting elements need to have that class set to false.
     * @type {object}
     */
    this.visibilityHandler = {
      visibilityMap: new Map(),
      frameHandle: undefined,
    };

    /**
     * Proportions of the screen, top and bottom, that trigger the ends of the
     * scroll changes.
     * @type {number[]}
     * @see DEFAULT_SCROLL_THRESHOLD_PROPORTIONS
     */
    this.scrollThresholdProportions = DEFAULT_SCROLL_THRESHOLD_PROPORTIONS;

    /**
     * D3 scale for determining offset top for scrolling based on the position
     * of the element.
     * @type {Function|undefined}
     */
    this.offsetScale = undefined;

    /**
     * Name of story to display.
     * @type {string}
     */
    this.storyName = undefined;
  }

  /**
   * Perform initialization specific to config.
   *
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @param {string} configJson.jsonDataUrl Url of experiment data to use.
   * @param {number[]} configJson.scrollThresholdProportions
   * @param {string} configJson.storyName Name of story to display.
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
    const {jsonDataUrl, scrollThresholdProportions, storyName} = configJson;
    if (!jsonDataUrl || typeof jsonDataUrl !== 'string') {
      throw new Error('jsonDataUrl config field is missing');
    }
    this.jsonDataUrl = jsonDataUrl;

    if (typeof storyName !== 'string') {
      throw new Error('storyName config field is missing');
    }
    this.storyName = storyName;

    if (scrollThresholdProportions !== undefined) {
      this.scrollThresholdProportions = scrollThresholdProportions;
    }

    TRANSFORMER_WALKTHROUGH_VIS_CLASSES.forEach((className) => {
      this.containerElem.classList.add(className);
    });

    // Check config for optional fields.
    const {margin} = configJson;
    this.margin = {
      bottom: margin?.bottom ?? DEFAULT_MARGIN_PX.bottom,
      left: margin?.left ?? DEFAULT_MARGIN_PX.left,
      right: margin?.right ?? DEFAULT_MARGIN_PX.right,
      top: margin?.top ?? DEFAULT_MARGIN_PX.top,
    };

    // Loading...
    await loadProgressUntil(
      this.containerElem,
      this.fetcher
        .fetch(jsonDataUrl)
        .then((response) => response.text())
        .then((stringData) => void this.setupExperimentData(stringData)),
    );

    this.setupExampleNetworkData();

    this.setupContent();
  }

  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  setupExperimentData(stringData) {
    this.experimentData.initFromString(stringData);
    this.experimentIndex = 0;
  }

  /**
   * Using `experimentData`, set up the `exampleNetworkData` which will be bound
   * to create visual elements. This includes sequences of source input tokens,
   * target input tokens and target output tokens. The parameters to this method
   * determine how many of these tokens to preserve. Indices may be negative
   * numbers, which mean offset indices from the end of the array.
   * @param {object} params Optional parameters.
   * @param {number[]} params.sourceInputTokenKeptIndices Indices of source
   * input tokens NOT to fold into position ranges.
   * @param {number[]} params.targetInputTokenKeptIndices Indices of target
   * input tokens NOT to fold into position ranges.
   * @param {object[]} params.layerTags Tags for specific hidden state vectors.
   * @param {object} params.stopPoints Nodes at which to stop rendering.
   * @param {object[]} params.patches Array of patch connections.
   */
  setupExampleNetworkData(params) {
    if (params && typeof params !== 'object') {
      throw new Error('unexpected params data type');
    }

    const {
      sourceInputTokenKeptIndices,
      targetInputTokenKeptIndices,
      layerTags,
      stopPoints,
      patches,
    } = params || {};

    const experiment =
      this.experimentData.flatExperiments[this.experimentIndex];

    const sourceNetworkRows = this.createNetworkRows({
      inputTokens: experiment['tokenized_source'],
      outputTokens: experiment['source_generated_toks'],
      networkIndex: 0,
      stopPoints,
      inputTokenKeptIndices: sourceInputTokenKeptIndices,
    });

    const targetNetworkRows = this.createNetworkRows({
      inputTokens: experiment['tokenized_target'],
      outputTokens: experiment['generated_toks'],
      networkIndex: 1,
      stopPoints,
      inputTokenKeptIndices: targetInputTokenKeptIndices,
    });

    const networks = [];
    if (sourceNetworkRows.length > 0) {
      networks.push(sourceNetworkRows);
    }
    if (targetNetworkRows.length > 0) {
      networks.push(targetNetworkRows);
    }

    this.exampleNetworkData = {
      numLayers: 40,
      skipLayersConfig: [[4, -2]],
      showArrows: {
        inputTokenToEmbedding: true,
        embeddingToLayer: true,
        layerToNextLayer: true,
        layerToLaterToken: true,
        layerToUnembedding: true,
        unembeddingToOutputToken: true,
      },
      networks,
      patches: patches ?? [],
      layerTags: layerTags ?? [],
      stopPoints: stopPoints ?? [],
    };
  }

  /**
   * @param {object} params Parameters for creating network rows.
   * @param {string[]} params.inputTokens Input token strings.
   * @param {string[]} params.outputTokens Output token strings.
   * @param {number} params.networkIndex Index of this network.
   * @param {object[]} params.stopPoints Optional stop points.
   * @param {number[]} params.inputTokenKeptIndices Indices of source input
   * tokens NOT to fold into position ranges.
   */
  createNetworkRows(params) {
    //const inputTokens = experiment['tokenized_source'];

    const {inputTokens, inputTokenKeptIndices, outputTokens, stopPoints} =
      params;

    const networkRows = [];
    for (
      let positionIndex = 0;
      positionIndex < inputTokens.length;
      positionIndex++
    ) {
      if (stopPoints) {
        const hitStopIndex = stopPoints.findIndex(
          (stopPoint) =>
            stopPoint.networkIndex === params.networkIndex &&
            stopPoint.positionIndex < positionIndex,
        );
        if (hitStopIndex !== -1) {
          break;
        }
      }

      const inputToken = inputTokens[positionIndex];
      networkRows.push({inputToken, positionIndex: positionIndex});
    }

    // Fold non-kept source input token rows into ranges.
    if (inputTokenKeptIndices !== undefined) {
      foldNetworkRows(networkRows, inputTokenKeptIndices);
    }

    // Set custom margins for folded rows.
    for (const networkRow of networkRows) {
      if (networkRow.positionIndexRange) {
        // TODO(jimbo): Make this configurable.
        networkRow.marginBottom = 20;
        networkRow.marginTop = 20;
      }
    }

    for (
      let outputTokensIndex = 0;
      outputTokens && outputTokensIndex < outputTokens.length;
      outputTokensIndex++
    ) {
      // If there are no networkRows, then we've already passed the stop
      // point, and there's nowhere to display the generated tokens.
      if (!networkRows.length) {
        break;
      }

      const outputToken = outputTokens[outputTokensIndex];
      const outputPositionIndex = inputTokens.length + outputTokensIndex - 1;

      if (stopPoints) {
        const hitStopIndex = stopPoints.findIndex(
          (stopPoint) =>
            stopPoint.networkIndex === params.networkIndex &&
            stopPoint.positionIndex < outputPositionIndex,
        );
        if (hitStopIndex !== -1) {
          break;
        }
      }

      const previousNetworkRow = networkRows[networkRows.length - 1];

      if (outputTokensIndex === 0) {
        // For the first output, set the outputToken of the previous target
        // network row.
        previousNetworkRow.outputToken = outputToken;
      } else {
        // For subsequent outputs, create new target network rows which
        // increment from the previous row's position index.
        const previousPositionIndex =
          previousNetworkRow.positionIndex ??
          previousNetworkRow.positionIndexRange[1];
        networkRows.push({
          outputToken,
          positionIndex: previousPositionIndex + 1,
        });
      }
    }

    return networkRows;
  }

  /**
   * Set up the content element inside the container for scrollytelling.
   */
  setupContent() {
    // Make sure container element fills the explorable column.
    const containerSel = d3.select(this.containerElem).style('width', '100%');

    // Insert content div for holding story elements.
    this.contentSel = containerSel.append('div').classed('content', true);

    // Set up story scene.
    this.setupStory();

    // Make sure the content element is tall enough to handle the story.
    // containerSel.style(
    //   'height',
    //   `${this.storyScene.getScrollHeight() + window.innerHeight}px`,
    // );

    // Setup scrolling updates.
    this.containerElem.ownerDocument.addEventListener('scroll', () => {
      this.queueHandleScroll();
    });
    this.queueHandleScroll();
  }

  /**
   * Set up story scenes.
   */
  setupStory() {
    this.svgSel = this.contentSel.append('svg');
    this.rootGroupSel = this.svgSel.append('g');

    const createStoryFn = {
      'initial-embedding': this.createInitialEmbeddingStory,
      'initial-token-first-layer': this.createInitialTokenFirstLayerStory,
      'initial-token-full-row': this.createInitialTokenFullRowStory,
      'second-token-full-row': this.createSecondTokenFullRowStory,
      'first-generated-token': this.createFirstGeneratedTokenStory,
      'remaining-generated-tokens': this.createRemainingGeneratedTokensStory,
    }[this.storyName];

    if (typeof createStoryFn !== 'function') {
      throw new Error(`story not found: ${storyName}`);
    }

    this.storyScene = createStoryFn.call(this);
    this.contentSel.classed(this.storyName, true);

    // Setup offset scale for scrolling based on story's scroll height.
    const scrollHeight = this.storyScene.getScrollHeight();
    const windowHeight = window.innerHeight;
    const topThreshold = windowHeight * DEFAULT_SCROLL_THRESHOLD_PROPORTIONS[0];
    const bottomThreshold =
      windowHeight * DEFAULT_SCROLL_THRESHOLD_PROPORTIONS[1];

    this.offsetScale = d3
      .scaleLinear()
      .domain([bottomThreshold, topThreshold])
      .range([1, scrollHeight])
      .clamp(true);
  }

  /**
   * Story for the initial token's embedding.
   */
  createInitialEmbeddingStory() {
    return this.createStory([
      {
        stopPoints: [
          {networkIndex: 0, positionIndex: 0, layerIndex: -1},
          {networkIndex: 1, positionIndex: -1},
        ],
        scrollHeight: 20,
      },
    ]);
  }

  /**
   * Story for the initial hidden state vector.
   */
  createInitialTokenFirstLayerStory() {
    return this.createStory([
      {
        stopPoints: [
          {networkIndex: 0, positionIndex: 0, layerIndex: -1},
          {networkIndex: 1, positionIndex: -1},
        ],
        scrollHeight: 20,
      },
      {
        stopPoints: [
          {networkIndex: 0, positionIndex: 0, layerIndex: 0},
          {networkIndex: 1, positionIndex: -1},
        ],
        layerTags: [
          {networkIndex: 0, positionIndex: 0, layerIndex: 0, tag: 'outline'},
        ],
        scrollHeight: 20,
      },
    ]);
  }

  /**
   * Story for the initial hidden state vector.
   */
  createInitialTokenFullRowStory() {
    return this.createStory([
      ...[0, 1, 2, 3, 4, 39].map((layerIndex) => ({
        stopPoints: [
          {networkIndex: 0, positionIndex: 0, layerIndex},
          {networkIndex: 1, positionIndex: -1},
        ],
        layerTags: [
          {networkIndex: 0, positionIndex: 0, layerIndex, tag: 'outline'},
        ],
        scrollHeight: 20,
      })),
    ]);
  }

  /**
   * Story for the second token propagating through the row.
   */
  createSecondTokenFullRowStory() {
    return this.createStory([
      ...[0, 1, 2, 3, 4, 39].map((layerIndex) => ({
        stopPoints: [
          {networkIndex: 0, positionIndex: 1, layerIndex},
          {networkIndex: 1, positionIndex: -1},
        ],
        layerTags: [
          {networkIndex: 0, positionIndex: 1, layerIndex, tag: 'outline'},
        ],
        scrollHeight: 20,
      })),
    ]);
  }

  /**
   * Story for the first generated token.
   */
  createFirstGeneratedTokenStory() {
    return this.createStory([
      {
        stopPoints: [
          {networkIndex: 0, positionIndex: 1, layerIndex: 39},
          {networkIndex: 1, positionIndex: -1},
        ],
        layerTags: [
          {networkIndex: 0, positionIndex: 1, layerIndex: 39, tag: 'outline'},
        ],
        scrollHeight: 20,
      },
      ...[0, 1, 2, 3, 4, 39].map((layerIndex) => ({
        stopPoints: [
          {networkIndex: 0, positionIndex: 2, layerIndex},
          {networkIndex: 1, positionIndex: -1},
        ],
        layerTags: [
          {networkIndex: 0, positionIndex: 2, layerIndex, tag: 'outline'},
        ],
        scrollHeight: 20,
      })),
    ]);
  }

  /**
   * Story for generated tokens after the first.
   */
  createRemainingGeneratedTokensStory() {
    const {sourcePromptInputTokens, sourcePromptOutputTokens} =
      this.getExperimentInfo();

    const lastSourcePromptTokenPosition =
      sourcePromptInputTokens.length + sourcePromptOutputTokens.length;

    return this.createStory([
      {
        stopPoints: [
          {networkIndex: 0, positionIndex: 2, layerIndex: 39},
          {networkIndex: 1, positionIndex: -1},
        ],
        layerTags: [
          {networkIndex: 0, positionIndex: 2, layerIndex: 39, tag: 'outline'},
        ],
        scrollHeight: 20,
      },
      ...d3
        .cross(d3.range(3, lastSourcePromptTokenPosition), [0, 1, 2, 3, 4, 39])
        .map(([positionIndex, layerIndex]) => ({
          stopPoints: [
            {networkIndex: 0, positionIndex, layerIndex},
            {networkIndex: 1, positionIndex: -1},
          ],
          layerTags: [
            {networkIndex: 0, positionIndex, layerIndex, tag: 'outline'},
          ],
          scrollHeight: 20,
        })),
    ]);
  }

  /**
   * Convenience method for extracting fields from selected flat experiment.
   * @returns {object} Object containing normalized experiment info.
   */
  getExperimentInfo() {
    const experiment =
      this.experimentData.flatExperiments[this.experimentIndex];

    const sourcePromptInputTokens = experiment['tokenized_source'];
    const sourcePromptOutputTokens = experiment['source_generated_toks'];
    const targetPromptInputTokens = experiment['tokenized_target'];
    const targetPromptOutputTokens = experiment['generated_toks'];

    const sourcePatchPositionIndex = applyBasis(
      experiment['position_source'],
      sourcePromptInputTokens.length,
    );
    const sourcePatchLayerIndex = experiment['layer_source'] + 1;

    const targetPatchPositionIndex = applyBasis(
      experiment['position_target'],
      targetPromptInputTokens.length,
    );
    const targetPatchLayerIndex = experiment['layer_target'] + 1;

    const patch = {
      from: {
        networkIndex: 0,
        positionIndex: sourcePatchPositionIndex,
        layerIndex: sourcePatchLayerIndex,
      },
      to: {
        networkIndex: 1,
        positionIndex: targetPatchPositionIndex,
        layerIndex: targetPatchLayerIndex,
      },
    };

    return {
      sourcePrompt: experiment['prompt_source'],
      sourcePromptInputTokens,
      sourcePromptOutputTokens,
      targetPrompt: experiment['prompt_target'],
      targetPromptInputTokens,
      targetPromptOutputTokens,
      patch,
    };
  }

  /**
   * @param {object[]} paramsList Squence of network params.
   * @returns {StoryScene} For the text and list of network params.
   */
  createStory(paramsList) {
    // Convenience method for generating story scenes that show network states.
    const makeNetworkScene = (params) =>
      new CallbackStoryScene({
        onEnter: () => {
          const {onEnter, contentClassName} = params;
          onEnter && onEnter();
          contentClassName && this.contentSel.classed(contentClassName, true);
          this.setupExampleNetworkData(params);
          this.bindDataToVis();
        },
        onExit: () => {
          const {onExit, contentClassName} = params;
          onExit && onExit();
          contentClassName && this.contentSel.classed(contentClassName, false);
        },
        scrollHeight: params.scrollHeight ?? 200,
      });

    // First, set up a sequence story scene for the network changes. The total
    // scroll height of this scene will inform the text description scene.
    const networkStoryScene = new SequenceStoryScene(
      paramsList.map(makeNetworkScene),
    );

    return networkStoryScene;
  }

  /**
   * Called when the user scrolls. Schedule handling the scroll on next
   * animation frame. This debounces potentially expensive DOM changes if scroll
   * events come in more rapidly than once per frame.
   */
  queueHandleScroll() {
    if (this.frameHandle !== undefined) {
      return;
    }
    this.frameHandle = requestAnimationFrame(() => {
      this.frameHandle = undefined;
      this.handleScroll();
    });
  }

  /**
   * Handle user scroll by moving the container element, which has
   * `position:fixed`, such that its `top` and `bottom` fall within the bounding
   * box of the container.
   */
  handleScroll() {
    const rect = this.containerElem.getBoundingClientRect();

    // Fit content to visible portion of the container.
    //const bottom = Math.max(window.innerHeight - rect.bottom, 0);
    //const top = Math.max(rect.top, 0);
    //this.contentSel.style('bottom', `${bottom}px`).style('top', `${top}px`);

    // Compute offset top for scrollytelling update.
    this.offsetTop = this.offsetScale(rect.top);
    this.update();
  }

  /**
   * Update visualization elements in response to user interaction.
   */
  update() {
    this.storyScene.scroll(this.offsetTop);
  }

  /**
   * TODO(jimbo): Document.
   */
  bindDataToVis() {
    const patchingNetwork = new PatchingNetwork();
    this.patchingNetwork = patchingNetwork;

    patchingNetwork.numLayers = this.exampleNetworkData.numLayers;
    patchingNetwork.skipLayersConfig =
      this.exampleNetworkData.skipLayersConfig ?? [];
    patchingNetwork.keepLayersConfig =
      this.exampleNetworkData.keepLayersConfig ?? [];
    patchingNetwork.networkTokenRows = this.exampleNetworkData.networks;

    // TODO(jimbo): Make these configurable.
    [
      patchingNetwork.inputTokenColumnConfigTemplate,
      patchingNetwork.hiddenStateVectorColumnConfigTemplate,
      patchingNetwork.outputTokenColumnConfigTemplate,
    ].forEach((columnConfigTemplate) => {
      columnConfigTemplate.marginLeft = 20;
      columnConfigTemplate.marginRight = 20;
      columnConfigTemplate.paddingLeft = 5; // Space for arrow heads.
      columnConfigTemplate.paddingRight = 2;
      columnConfigTemplate.width = 14;
    });

    [
      patchingNetwork.embeddingColumnConfigTemplate,
      patchingNetwork.unembeddingColumnConfigTemplate,
    ].forEach((columnConfigTemplate) => {
      columnConfigTemplate.marginLeft = 20;
      columnConfigTemplate.marginRight = 20;
      columnConfigTemplate.paddingLeft = 5; // Space for arrow heads.
      columnConfigTemplate.paddingRight = 2;
      columnConfigTemplate.width = 10;
    });

    [patchingNetwork.skippedLayersColumnConfigTemplate].forEach(
      (columnConfigTemplate) => {
        columnConfigTemplate.marginLeft = 32;
        columnConfigTemplate.marginRight = 32;
        columnConfigTemplate.paddingLeft = 11; // Space for arrow heads.
        columnConfigTemplate.paddingRight = 8;
        columnConfigTemplate.width = 16;
      },
    );

    patchingNetwork.networkRowConfigTemplate.height = 14;
    patchingNetwork.networkRowConfigTemplate.marginTop = 20;
    patchingNetwork.networkRowConfigTemplate.marginBottom = 20;

    patchingNetwork.networkConfigTemplate.marginBottom = 60;

    for (const patch of this.exampleNetworkData.patches) {
      patchingNetwork.addPatch(patch);
    }

    for (const layerTag of this.exampleNetworkData.layerTags) {
      patchingNetwork.addLayerTag(layerTag);
    }

    for (const stopPoint of this.exampleNetworkData.stopPoints) {
      patchingNetwork.addStopPoint(stopPoint);
    }

    patchingNetwork.update();

    const renderables = [...patchingNetwork.renderables.values()];

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
        const node = nodes[index];
        renderable.update(node);
        this.visibilityHandler.visibilityMap.set(node, true);
      });

    // NOTE: Typically, one would call `.remove()` to take the elements out of
    // the DOM. However, in our case it's OK to leave them in because we're
    // using the `data-key` attribute to uniquely specify DOM nodes for network
    // nodes. There may be invisible DOM nodes, if the user scrolls back up, but
    // the total number of DOM nodes is limited to the largest network
    // visualized. Leaving the DOM nodes in also affords CSS transitions for
    // fading the invisible items out.
    renderablesUpdateSel.exit().each((renderable, index, nodes) => {
      const node = nodes[index];
      renderable.exit(node);
      this.visibilityHandler.visibilityMap.set(node, false);
    });

    if (this.visibilityHandler.frameHandle === undefined) {
      this.visibilityHandler.frameHandle = requestAnimationFrame(() => {
        this.visibilityHandler.frameHandle = undefined;
        for (const [node, isVisible] of this.visibilityHandler.visibilityMap) {
          const {classList} = node;
          if (isVisible) {
            classList.add('visible');
          } else {
            classList.remove('visible');
          }
        }
        this.visibilityHandler.visibilityMap.clear();
        this.fitToContents();
      });
    }
  }

  /**
   * Stretch the visualization SVG to fit its contents, and transform the root
   * group element to align with specified margin.
   */
  fitToContents() {
    fitToContents(this.svgSel.node(), this.margin, this.rootGroupSel.node());
  }
}

/**
 * Factory function that returns a callback to register vis. The returned
 * callback function will construct and initialize a
 * `TransformerWalkthroughVis`.
 * @see PatchingWalkthroughVis
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's an instance.
 */
export function transformerWalkthroughkVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new TransformerWalkthroughVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
