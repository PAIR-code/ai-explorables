/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Shows a step-by-step walkthrough of how patching works.
 */

import {getRenderableKey} from './renderables/renderable.js';
import {PatchingNetwork} from './patching-network.js';
import {ExperimentData} from '../../lib/experiment-data.js';
import {loadProgressUntil} from '../../lib/load-progress-until.js';
import {fitToContents} from '../../lib/fit-to-contents.js';
import {CallbackStoryScene} from '../../lib/callback-story-scene.js';
import {foldNetworkRows} from './lib/fold-network-rows.js';
import {SequenceStoryScene} from '../../lib/sequence-story-scene.js';
import {ConcurrentStoryScene} from '../../lib/concurrent-story-scene.js';
import {StoryScene} from '../../lib/story-scene.js';
import {applyBasis} from '../../lib/apply-basis.js';
import {NetworkLabelNode} from './renderables/network-label-node.js';

/**
 * CSS classes to assign to container for styling.
 */
const PATCHING_WALKTHROUGH_VIS_CLASSES = [
  'patching-network-vis',
  'patching-walkthrough-vis',
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
 * Indices of layers to show in the diagram.
 */
const SHOWN_LAYER_INDICES = [0, 1, 2, 3, 39];

/**
 * Walkthrough vis explaining how patching works in steps.
 */
class PatchingWalkthroughkVis {
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
     * D3 selection housing the injected `<div>` element for story text content.
     * @type {d3.Selection}
     */
    this.storyTextSel = undefined;

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

    // Check the config for required fields.
    const {jsonDataUrl} = configJson;
    if (!jsonDataUrl || typeof jsonDataUrl !== 'string') {
      throw new Error('jsonDataUrl field is missing');
    }
    this.jsonDataUrl = jsonDataUrl;

    PATCHING_WALKTHROUGH_VIS_CLASSES.forEach((className) => {
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
    containerSel.style(
      'height',
      `${this.storyScene.getScrollHeight() + window.innerHeight}px`,
    );

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
    this.storyTextSel = this.contentSel
      .append('div')
      .classed('story-column', true);

    this.svgSel = this.contentSel.append('svg').classed('vis-column', true);
    this.rootGroupSel = this.svgSel.append('g');

    // Append container for network diagram elements.
    this.rootGroupSel.append('g').classed('diagram', true);

    // Sequence of stories to describe patching.
    let stepNumber = 1;
    const mainStoryScene = new SequenceStoryScene([
      this.createRunSourcePromptStory(stepNumber++),
      this.createExtractHiddenRepresentationStory(stepNumber++),
      this.createTargetInputPromptStory(stepNumber++),
      this.createPatchingStory(stepNumber++),
      this.createGenerateOutputStory(stepNumber++),
    ]);

    // Parallel story for detecting exit. This allows us to conditionally make
    // the SVG invisible when the user scrolls back up past the beginning.
    const parallelStoryScene = new CallbackStoryScene({
      scrollHeight: mainStoryScene.getScrollHeight(),
      onEnter: () => {
        this.svgSel.classed('visible', true);
        this.contentSel.classed('fixed', true);
      },
      onExit: (offsetTop, previousOffsetTop) => {
        if (offsetTop < previousOffsetTop) {
          // Exiting by scrolling upwards.
          this.svgSel.classed('visible', false);
          this.contentSel.classed('fixed', false);
        }
      },
    });

    this.storyScene = new ConcurrentStoryScene([
      mainStoryScene,
      parallelStoryScene,
    ]);
  }

  /**
   * @param {number} stepNumber Number to show in Step header.
   * @returns {StoryScene} Story about running source prompt.
   */
  createRunSourcePromptStory(stepNumber) {
    const {sourcePromptInputTokens, sourcePromptOutputTokens} =
      this.getExperimentInfo();

    const textSel = this.storyTextSel.append('p').html(`
      <strong>Step </strong>: Run a tokenized source prompt, <span
      class="source-prompt"></span>, through the source model. Each transformer
      layer is denoted with <span class="label">ℓ<sup>𝑖</sup></span> for
      clarity.
    `);
    textSel.select('strong').append('span').text(stepNumber);
    textSel
      .select('.source-prompt')
      .selectAll('span')
      .data(sourcePromptInputTokens)
      .enter()
      .append('span')
      .classed('token-wrapper', true)
      .append('span')
      .classed('token', true)
      .classed('token-active', true)
      .text((token) => token);

    const totalSourceTokens =
      (sourcePromptInputTokens?.length || 0) +
      (sourcePromptOutputTokens?.length || 0);
    const sourcePositionIndices = d3.range(0, totalSourceTokens + 1);

    // Show the source input and output (generation), step-by-step.
    const paramsList = d3
      .cross(sourcePositionIndices, SHOWN_LAYER_INDICES)
      .map(([positionIndex, layerIndex]) => ({
        stopPoints: [
          {networkIndex: 0, positionIndex, layerIndex},
          {networkIndex: 1, positionIndex: -1},
        ],
        layerTags: [
          {networkIndex: 0, positionIndex, layerIndex, tag: 'outline'},
        ],
        scrollHeight: 20,
      }));

    return this.createStory(
      textSel,
      paramsList,
      'run-source-prompt-story',
      true,
    );
  }

  /**
   * @param {number} stepNumber Number to show in Step header.
   * @returns {StoryScene} Story about extracting hidden representation.
   */
  createExtractHiddenRepresentationStory(stepNumber) {
    const textSel = this.storyTextSel.append('p').html(`
      <strong>Step </strong>: Extract the <span
      class="hidden-representation">hidden representation</span> of interest
      from the source location (i.e., a token position at a layer in the model).
      We explain one method for selecting a source location in the case studies
      that follow.
    `);
    textSel.select('strong').append('span').text(stepNumber);

    const {patch} = this.getExperimentInfo();

    // Show the source input and output (generation), step-by-step.
    const paramsList = [
      {
        stopPoints: [{networkIndex: 1, positionIndex: -1}],
        layerTags: [
          {...patch.from, tag: 'outline'},
          {...patch.from, tag: 'highlight'},
        ],
        scrollHeight: 400,
      },
    ];

    return this.createStory(textSel, paramsList, 'extract-story');
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
   * @param {number} stepNumber Number to show in Step header.
   * @returns {StoryScene} Story about running forward comp on target.
   */
  createTargetInputPromptStory(stepNumber) {
    const {patch, targetPromptInputTokens} = this.getExperimentInfo();

    const textSel = this.storyTextSel.append('p').html(`
      <strong>Step </strong>: Run the inspection prompt,
      <span class="target-prompt"></span>, through the target model, stopping at a
      pre-determined target location. In the case studies that follow, we
      discuss two strategies to select a target location to answer specific
      questions about a given source location.
    `);
    textSel.select('strong').append('span').text(stepNumber);
    textSel
      .select('.target-prompt')
      .selectAll('span')
      .data(targetPromptInputTokens)
      .enter()
      .append('span')
      .classed('token-wrapper', true)
      .append('span')
      .classed('token', true)
      .classed('token-active', true)
      .text((token) => token);

    const stopPoints = [
      // {
      //   networkIndex: 0,
      //   positionIndex: sourcePatchPositionIndex,
      //   layerIndex: sourcePatchLayerIndex,
      // },
    ];

    const layerTags = [
      {...patch.from, tag: 'outline'},
      {...patch.from, tag: 'highlight'},
    ];

    const paramsList = [
      // Before the patch target row, iterate across full rows.
      ...d3
        .cross(d3.range(0, patch.to.positionIndex), SHOWN_LAYER_INDICES)
        .map(([positionIndex, layerIndex]) => ({
          stopPoints: [
            ...stopPoints,
            {networkIndex: 1, positionIndex, layerIndex},
          ],
          layerTags: [
            ...layerTags,
            {networkIndex: 1, positionIndex, layerIndex, tag: 'outline'},
          ],
          scrollHeight: 20,
        })),

      // For the last row of target input prompt tokens, iterate only up to the
      // experiment patch point.
      ...d3.range(0, patch.to.layerIndex).map((layerIndex) => {
        const positionIndex = patch.to.positionIndex;
        const params = {
          stopPoints: [
            ...stopPoints,
            {
              networkIndex: 1,
              positionIndex,
              layerIndex,
            },
          ],
          layerTags: [
            ...layerTags,
            {
              networkIndex: 1,
              positionIndex,
              layerIndex,
              tag: 'outline',
            },
          ],
          targetInputTokenKeptIndices: [[0, 2], -3, -1],
          scrollHeight: 80 + layerIndex * 40,
        };
        return params;
      }),
    ];

    return this.createStory(textSel, paramsList, 'run-forward-comp-story');
  }

  /**
   * @returns A `StoryScene` for the patching operation.
   */
  createPatchingStory(stepNumber) {
    const textSel = this.storyTextSel.append('p').html(`
      <strong>Step </strong>: At the <span class="target-location">target
      location</span>, inject the hidden representation extracted in Step 2. We
      call this the “patching operation”.
    `);
    textSel.select('strong').append('span').text(stepNumber);

    const {patch} = this.getExperimentInfo();

    const stopPoints = [patch.to];

    const layerTags = [
      {...patch.from, tag: 'outline'},
      {...patch.from, tag: 'highlight'},
    ];

    const patches = [patch];

    const paramsList = [
      // Establish the patch connection.
      {
        contentClassName: 'patching-story',
        stopPoints,
        layerTags: [...layerTags, {...patch.to, tag: 'hidden'}],
        patches,
        scrollHeight: 800,
      },

      // Second set highlights the target node as user scrolls close.
      {
        stopPoints,
        layerTags: [
          ...layerTags,
          {...patch.to, tag: 'highlight'},
          {...patch.to, tag: 'outline'},
        ],
        patches,
        scrollHeight: 200,
      },
    ];

    const networkStoryScene = this.createStory(textSel, paramsList);

    // Map offset height to dasharray length.
    const dasharrayScale = d3
      .scaleLinear()
      .domain([0, networkStoryScene.getScrollHeight()])
      .clamp(true);

    let pathLength = undefined;
    let lastDashLength = undefined;

    const updateArrowStoryScene = new CallbackStoryScene({
      onEnter: () => {
        this.contentSel.classed('patching-operation', true);
      },
      onExit: () => {
        this.contentSel.classed('patching-operation', false);
      },
      onScroll: (offsetTop) => {
        const patchConnectionElement = this.svgSel
          .select('[data-key^="patch-connection-"]')
          .node();
        if (!patchConnectionElement) {
          // onScroll() always runs, even if we're outside the scroll height.
          return;
        }
        if (pathLength === undefined) {
          const pathElem = patchConnectionElement.querySelector(
            '[data-role="arrow-body"]',
          );
          // Overshoot by 25% so we finish just as the arrow head appears.
          pathLength = pathElem.getTotalLength() * 1.25;
          dasharrayScale.range([0, pathLength]);
        }
        const dashLength = dasharrayScale(offsetTop);
        if (dashLength !== lastDashLength) {
          this.containerElem.style.setProperty(
            '--exp-patch-connection-default-arrow-body-stroke-dasharray',
            `${dashLength} 10000`,
          );
          lastDashLength = dashLength;
        }
      },
      scrollHeight: networkStoryScene.getScrollHeight(),
    });

    return new ConcurrentStoryScene([networkStoryScene, updateArrowStoryScene]);
  }

  /**
   * @returns A `StoryScene` for the extraction.
   */
  createGenerateOutputStory(stepNumber) {
    const {patch, targetPromptInputTokens, targetPromptOutputTokens} =
      this.getExperimentInfo();

    const textSel = this.storyTextSel.append('p').html(`
      <strong>Step </strong>: Continue generation for the inspection prompt,
      with the patched hidden representation taking the place of the <span
      class="token">x</span> token from that layer on. Each generated token is
      fed back into the network to update the sequence and allow generation to
      continue. Eventually, the model produces <span
      class="target-output"></span>, which is the largest city in the UK.
    `);
    textSel.select('strong').append('span').text(stepNumber);
    textSel
      .select('.target-output')
      .selectAll('span')
      .data(targetPromptOutputTokens)
      .enter()
      .append('span')
      .classed('token-wrapper', true)
      .append('span')
      .classed('token', true)
      .classed('token-active', true)
      .text((token) => token);

    // End generated output after the first comma (if any).
    const lastCommaIndex = targetPromptOutputTokens.findIndex(
      (token) => token === ',',
    );

    const targetOutputEndIndex =
      lastCommaIndex >= 0
        ? lastCommaIndex
        : targetPromptOutputTokens.length - 1;

    const targetOutputFinalPositionIndex =
      targetPromptInputTokens.length + targetOutputEndIndex - 1;

    const layerTags = [
      {...patch.from, tag: 'outline'},
      {...patch.from, tag: 'highlight'},
      {...patch.to, tag: 'outline'},
      {...patch.to, tag: 'highlight'},
      {...patch.to, tag: 'affected', after: true},
    ];

    const patches = [patch];

    const paramsList = [
      // Finish row after patch.
      ...[2, 3, 4, 39].map((layerIndex) => ({
        stopPoints: [
          {
            networkIndex: 1,
            positionIndex: patch.to.positionIndex,
            layerIndex,
          },
        ],
        layerTags: [
          ...layerTags,
          {
            networkIndex: 1,
            positionIndex: patch.to.positionIndex,
            layerIndex,
            tag: 'outline',
          },
        ],
        patches,
      })),

      // Additional rows up to the end.
      ...d3
        .cross(
          d3.range(
            patch.to.positionIndex + 1,
            targetOutputFinalPositionIndex + 1,
          ),
          SHOWN_LAYER_INDICES,
        )
        .map(([positionIndex, layerIndex]) => ({
          stopPoints: [
            {
              networkIndex: 1,
              positionIndex,
              layerIndex,
            },
          ],
          layerTags: [
            ...layerTags,
            {
              networkIndex: 1,
              positionIndex,
              layerIndex,
              tag: 'outline',
            },
          ],
          patches,
          scrollHeight: 20,
        })),

      // One last state to create a scroll buffer.
      {
        stopPoints: [
          {
            networkIndex: 1,
            positionIndex: targetOutputFinalPositionIndex + 1,
            layerIndex: -1,
          },
        ],
        layerTags,
        patches,
        scrollHeight: 600,
      },
    ];

    return this.createStory(textSel, paramsList, 'generate-output-story');
  }

  /**
   * @param {string} textSel Text of story to display.
   * @param {object[]} paramsList Squence of network params.
   * @param {string} contentClassName Optional class name to apply to SVG during
   * story.
   * @param {boolean} isTextStationary Whether the text selection for the story
   * should be stationary. Default false meanse it should scroll into place.
   * @returns {StoryScene} For the text and list of network params.
   */
  createStory(textSel, paramsList, contentClassName, isTextStationary = false) {
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

    const scrollHeight = networkStoryScene.getScrollHeight();

    const opacityScale = d3
      .scaleLinear()
      .domain([-600, -200, 0, scrollHeight - 100, scrollHeight])
      .range([0.0, 0.6, 1, 1, 0.6])
      .clamp(true);

    if (isTextStationary) {
      // Stationary text should start with some non-zero opacity (first
      // element in the following range value list).
      opacityScale.range([0.6, 0.6, 1, 1, 0.6]);
    }

    const topScale = d3
      .scaleLinear()
      .domain([-window.innerHeight, 0])
      .range([2 * window.innerHeight, 0])
      .clamp(true);

    const backgroundPositionYScale = d3
      .scaleLinear()
      .domain([0, scrollHeight])
      .range([-textSel.node().getBoundingClientRect().height, 0])
      .clamp(true);

    const textStoryScene = new CallbackStoryScene({
      onEnter: () => {
        if (contentClassName) {
          this.contentSel.classed(contentClassName, true);
        }
        textSel.classed('active-step', true);
      },
      onExit: () => {
        if (contentClassName) {
          this.contentSel.classed(contentClassName, false);
        }
        textSel.classed('active-step', false);
      },
      onScroll: (offsetTop) => {
        textSel
          .style(
            'background-position-y',
            `${backgroundPositionYScale(offsetTop)}px`,
          )
          .style('opacity', opacityScale(offsetTop))
          .select('strong')
          .style('opacity', opacityScale(offsetTop));

        if (!isTextStationary) {
          // Only slide text into place if it's not stationary.
          textSel.style('top', `${topScale(offsetTop)}px`);
        }
      },
      scrollHeight,
    });

    return new ConcurrentStoryScene([textStoryScene, networkStoryScene]);
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
    const bottom = Math.max(window.innerHeight - rect.bottom, 0);
    const top = Math.max(rect.top, 0);
    this.contentSel.style('bottom', `${bottom}px`).style('top', `${top}px`);

    // Compute offset top for scrollytelling update.
    this.offsetTop = -rect.top;
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
      columnConfigTemplate.marginLeft = 12;
      columnConfigTemplate.marginRight = 12;
      columnConfigTemplate.paddingLeft = 5; // Space for arrow heads.
      columnConfigTemplate.paddingRight = 2;
      columnConfigTemplate.width = 14;
    });

    [
      patchingNetwork.embeddingColumnConfigTemplate,
      patchingNetwork.unembeddingColumnConfigTemplate,
    ].forEach((columnConfigTemplate) => {
      columnConfigTemplate.marginLeft = 8;
      columnConfigTemplate.marginRight = 8;
      columnConfigTemplate.paddingLeft = 5; // Space for arrow heads.
      columnConfigTemplate.paddingRight = 2;
      columnConfigTemplate.width = 10;
    });

    [patchingNetwork.skippedLayersColumnConfigTemplate].forEach(
      (columnConfigTemplate) => {
        columnConfigTemplate.marginLeft = 16;
        columnConfigTemplate.marginRight = 16;
        columnConfigTemplate.paddingLeft = 11; // Space for arrow heads.
        columnConfigTemplate.paddingRight = 8;
        columnConfigTemplate.width = 16;
      },
    );

    patchingNetwork.networkRowConfigTemplate.height = 14;
    patchingNetwork.networkRowConfigTemplate.marginTop = 4;
    patchingNetwork.networkRowConfigTemplate.marginBottom = 4;

    patchingNetwork.networkConfigTemplate.marginBottom = 120;

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

    const networkLabelText = ['Source Prompt', 'Inspection Prompt'];
    const networkLabels =
      patchingNetwork.patchingNetworkConfig.networkConfigs.map(
        (networkConfig, networkIndex) => {
          return new NetworkLabelNode({
            networkIndex,
            rowConfig: networkConfig.rowConfigs[0],
            columnConfig: networkConfig.columnConfigs[0],
            text: networkLabelText[networkIndex],
          });
        },
      );

    const renderables = [
      ...networkLabels,
      ...patchingNetwork.renderables.values(),
    ];

    const renderablesUpdateSel = this.rootGroupSel
      .select('.diagram')
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
    const rootGroupNode = this.rootGroupSel.node();
    const contentGroupNode = this.rootGroupSel.select('.diagram').node();
    fitToContents(
      this.svgSel.node(),
      this.margin,
      rootGroupNode,
      contentGroupNode,
    );
  }
}

/**
 * Factory function that returns a callback to register vis. The returned
 * callback function will construct and initialize a `PatchingWalkthroughVis`.
 * @see PatchingWalkthroughVis
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's an instance.
 */
export function patchingWalkthroughkVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new PatchingWalkthroughkVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
