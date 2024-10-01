/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Visualize results of patching as an explorable grid.
 */

import {MultihopData} from '../../lib/multihop-data.js';
import {loadProgressUntil} from '../../lib/load-progress-until.js';

/**
 * CSS class to assign to container for styling.
 */
const MULTIHOP_VIS_CLASS = 'multihop-vis';
const ACCURACY_FILE =
  'https://storage.googleapis.com/uncertainty-over-space/explorables/patching/multihop/multihop_accuracy.json';
const ENTITY_FILE =
  'https://storage.googleapis.com/uncertainty-over-space/explorables/patching/multihop/multihop_entities_3.json';
const ACCURACY_GRID_SIZE = 40;
const TRUNCATE_INDEX = 10;
const ENTITY_TRUNCATE_INDEX = 10;
const GRID_WIDTH = 350; //px
const HEATMAP_MARGINS = {top: 10, right: 10, bottom: 40, left: 45};
const ENTITY_MARGINS = {top: 5, right: 5, bottom: 20, left: 5};
const GRID_CELL_SIZE =
  (GRID_WIDTH - HEATMAP_MARGINS.top - HEATMAP_MARGINS.bottom) /
  ACCURACY_GRID_SIZE;

const LEGEND_INFO = {
  'Unsuccessful Patch': 'none',
  'Successful Patch': 'rgb(103,24, 175)',
  'Selected Layer Pair': 'var(--pair-accent-pink-neon)',
};

const EXAMPLE_INFO = {
  0: {
    'source': "Pizza's",
    'correct_country': ['Italy'],
    'correct_city': ['Rome'],
    'incorrect': 'Nap les',
    'false_pos': ['24-0', '25-0', '26-0', '27-0', '39-1'],
  },
  1: {
    'source': "Sushi's",
    'correct_country': ['Japan'],
    'correct_city': ['Tokyo'],
    'incorrect': 'Japan',
    'false_pos': [],
  },
  6: {
    'source': "Fish and Chips's",
    'correct_country': ['United', 'Kingdom', 'England'],
    'correct_city': ['London'],
    'incorrect': 'United Kingdom',
    'false_pos': [],
  },
  11: {
    'source': "Pizza's",
    'correct_country': ['Italy'],
    'correct_city': ['Rome'],
    'incorrect': 'Italy',
    'false_pos': [],
  },
  12: {
    'source': "Sushi's",
    'correct_country': ['Japan'],
    'correct_city': ['Tokyo'],
    'incorrect': 'Japan',
    'false_pos': [],
  },
};

/**
 * Grid visualization.
 *
 */
class MultihopVis {
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
    this.entityTokenSel = undefined;
    this.entitySel = undefined;

    /**
     * Relative URL to JSON data. Supplied to `init()` via config.
     * @type {string}
     * @see init()
     */
    this.jsonDataUrl = undefined;

    this.accuracyData = undefined;

    /**
     * Max generation length. Supplied in metadata of fetched JSON.
     * @type {number}
     * @see setupData()
     */
    this.maxGenLen = undefined;
    this.entityData = undefined;
    this.currentPrompt = undefined;

    /**
     * Name of model from which data came. Supplied in metadata of fetched JSON.
     * @type {string}
     * @see setupData()
     */
    this.modelName = undefined;

    /**
     * Number of layers of the model. Supplied in metadata of fetched JSON.
     * @type {number}
     * @see setupData()
     */
    this.numLayers = undefined;

    this.experimentIndex = undefined;

    /**
     * Array of objects representing the target prompt.
     * @type {Object[]}
     * @property {number} targetTokens[].id Token id.
     * @property {boolean} targetTokens[].hasExperiments
     * @see setupData()
     */
    this.multiQueryTokens = undefined;

    this.patchedTokens = undefined;
    this.entitySel = undefined;
    /**
     * Experiment data parsed from fetched response.
     * @type {ExperimentData}
     * @see init()
     */
    this.multihopData = new MultihopData();

    /**
     * Two-dimensional grid for rendering the interactive table. Indexed first
     * by target layer, then source layer.
     * @type {Object[][]}
     * @see setupData()
     */
    this.targetLayersGrid = undefined;

    /**
     * Source layer selected for investigation.
     * @type {number}
     * @see setupVis()
     */
    this.selectedSourceLayer = undefined;
    this.rightTokenSel = undefined;

    /**
     * Target layer selected for investigation.
     * @type {number}
     * @see setupVis()
     */
    this.selectedTargetLayer = undefined;

    /**
     * Selected token id.
     * @type {number}
     * @see setupVis()
     */
    this.selectedTokenId = undefined;

    this.selectedExperiment = undefined;

    /**
     * Source layer being hovered.
     * @type {number}
     * @see setupVis()
     */
    this.hoveredSourceLayer = undefined;

    /**
     * Target layer being hovered.
     * @type {number}
     * @see setupVis()
     */
    this.hoveredTargetLayer = undefined;

    this.tokenSel = undefined;
    this.patchedTokenSel = undefined;

    /**
     * D3 selection housing the single queries.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.firstQuerySel = undefined;

    /**
     * D3 selection housing the single queries.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.secondQuerySel = undefined;

    this.legendSel = undefined;

    /**
     * D3 selection housing the injected `<table>` element for visualizing.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.tableSel = undefined;
    this.promptsSel = undefined;

    /**
     * D3 selection housing the multihop prompt.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.multiQuerySel = undefined;
    this.patchedSel = undefined;

    this.currentExperiment = undefined;
    this.experimentOptions = undefined;
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
    this.containerElem = containerElem;

    // Set initially selected source and target layers.
    this.selectedSourceLayer = 16;
    this.selectedTargetLayer = 7;
    this.experimentIndex = Object.keys(EXAMPLE_INFO)[0];

    // Check the config for required fields.
    const {jsonDataUrl} = configJson;
    if (!jsonDataUrl || typeof jsonDataUrl !== 'string') {
      throw new Error('jsonDataUrl field is missing');
    }
    this.jsonDataUrl = jsonDataUrl;

    // Set a CSS class on the container for styling.
    containerElem.classList.add(MULTIHOP_VIS_CLASS);

    await this.fetcher
      .fetch(ACCURACY_FILE)
      .then((response) => response.text())
      .then((stringData) => void this.setupAccuracyData(stringData));

    await this.fetcher
      .fetch(ENTITY_FILE)
      .then((response) => response.text())
      .then((stringData) => void this.setupEntityData(stringData));

    await loadProgressUntil(
      this.containerElem,
      this.fetcher
        .fetch(this.jsonDataUrl)
        .then((response) => response.text())
        .then((stringData) => void this.setupData(stringData)),
    );

    // Once data is loaded and initialized, set up the visual elements.
    this.setupVis();
  }

  setupEntityData(stringData) {
    let parsedData = JSON.parse(stringData);
    this.entityData = parsedData;
  }

  setupAccuracyData(stringData) {
    this.accuracyData = Array.from(Array(ACCURACY_GRID_SIZE), (_) =>
      Array(ACCURACY_GRID_SIZE).fill(0),
    );
    let parsedData = JSON.parse(stringData);
    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const source = row['layer_source'];
      const target = row['layer_target'];
      const acc = row['accuracy'];
      this.accuracyData[source][target] = acc;
    }
  }

  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  setupData(stringData) {
    this.multihopData.initFromString(stringData);

    // NOTE: This visualization assumes that the loaded flat experiments all
    // have the same values for these fields, so reading them off the first
    // experiment suffices.
    const flatExperiment =
      this.multihopData.flatExperiments[this.experimentIndex];
    this.maxGenLen = flatExperiment['max_gen_len'];
    this.modelName = flatExperiment['model'];
    this.numLayers = flatExperiment['num_layers'];

    // Create skeleton grid, a two-dimensional array indexed first by target
    // layer, then by source layer. Fill each grid object with the layer numbers
    // and the list of generated tokens.
    this.targetLayersGrid = new Array();
    for (var row = 0; row < this.numLayers; row++) {
      this.targetLayersGrid.push(new Array());
      for (var column = 0; column < this.numLayers; column++) {
        const sourceToTarget = column + '-' + row;
        this.targetLayersGrid[row].push({
          sourceLayer: column,
          targetLayer: row,
          accuracy: this.accuracyData[column][row],
          experiments: this.multihopData.outputs[sourceToTarget],
        });
      }
    }

    this.currentExperiment =
      this.targetLayersGrid[0][0].experiments[this.experimentIndex];
    this.currentPrompt =
      this.targetLayersGrid[0][0].experiments[this.experimentIndex][
        'multihop_prompt'
      ];

    this.patchedTokens = this.processTokens(
      this.currentExperiment['patched_generation'],
    );
    this.entityTokens = this.entityData[this.currentPrompt][0][39]
      .map((id) => ({
        id,
      }))
      .slice(0, ENTITY_TRUNCATE_INDEX);
  }

  processTokens(tokens) {
    return tokens.split(' ').map((id) => ({id}));
  }
  /**
   * Set up the visualization. Expects `setupData()` to have already been called
   * succesfully and ran to completion.
   * @see setupData()
   */
  setupVis() {
    this.renderLeftSidebar();
    this.renderAccuracyGrid();
    this.renderRightSidebar();
    this.update();
  }

  /**
   * Callback handler invoked when the user clicks on any cell of the table.
   * @param {Object} datum Data object bound to the clicked element.
   * @param {number} datum.sourceLayer Index of the selected source layer.
   * @param {number} datum.targetLayer Index of the selected source layer.
   */
  handleCellClick(datum) {
    let needsUpdate = false;
    if ('sourceLayer' in datum) {
      this.selectedSourceLayer = datum.sourceLayer;
      needsUpdate = true;
    }
    if ('targetLayer' in datum) {
      this.selectedTargetLayer = datum.targetLayer;
      needsUpdate = true;
    }
    if ('experiment' in datum) {
      this.currentExperiment = experiment[this.experimentIndex];
      needsUpdate = true;
    }
    if (needsUpdate) {
      this.update();
    }
  }

  renderAccuracyGrid() {
    const columnLabels = [
      {},
      ...d3.range(this.numLayers).map((sourceLayer) => ({
        sourceLayer,
        text: `${sourceLayer}`.padStart(2, '0'),
      })),
      {},
    ];

    this.tableSel = d3
      .select(this.containerElem)
      .append('div')
      .classed('table-container', true);
    this.tableSel
      .append('div')
      .classed('section-title grid', true)
      .text('Patching vs. Baseline Multi-Hop Accuracy');
    const instruction = this.tableSel
      .append('div')
      .classed('instruction grid', true)
      .text('Mouse over the grid to select a source and target layer pair -- ');
    instruction
      .append('span')
      .attr('class', 'underline-patching')
      .text('filled in');
    instruction
      .append('span')
      .text(' cells denote layer pairs that successfully correct the output.');

    this.renderGrid();
  }
  renderExample(exampleIndex) {
    const experiment = this.targetLayersGrid[0][0].experiments[exampleIndex];
    const promptContainer = this.promptsSel
      .append('div')
      .attr('id', 'example-' + exampleIndex.toString())
      .style(
        'display',
        this.experimentIndex !== exampleIndex ? 'none' : 'flex',
      );

    const collapsibleSection = promptContainer
      .append('div')
      .attr('class', 'example');

    const step1QuerySection = collapsibleSection
      .append('div')
      .classed('line output basic', true)
      .attr('data-role', 'step1-query-section');
    step1QuerySection
      .append('div')
      .classed('label', true)
      .text(experiment['hop2_prompt']);

    const tokens1 = step1QuerySection
      .append('p')
      .classed('token-container', true);

    this.initTokens(
      tokens1,
      this.processTokens(experiment['hop2_generation']),
      EXAMPLE_INFO[exampleIndex]['correct_country'],
      true,
    );

    step1QuerySection
      .append('div')
      .classed('label', true)
      .style('padding-top', '8px')
      .text(experiment['hop3_prompt']);

    const tokens2 = step1QuerySection
      .append('p')
      .classed('token-container', true);

    this.initTokens(
      tokens2,
      this.processTokens(experiment['hop3_generation']),
      EXAMPLE_INFO[exampleIndex]['correct_city'],
      true,
    );
  }

  /** Renders token container sidebar. */
  renderLeftSidebar() {
    this.tokenSel = d3
      .select(this.containerElem)
      .append('div')
      .attr('class', 'sidebar-container queries');

    const sidebar = this.tokenSel.append('div').attr('class', 'sidebar left');
    this.promptsSel = sidebar.append('div').classed('prompts-container', true);
    this.legendSel = sidebar.append('div').classed('legend', true);
    this.renderLegend();

    const sidebarHeader = this.promptsSel
      .append('div')
      .classed('sidebar-header', true);
    sidebarHeader
      .append('div')
      .classed('section-title', true)
      .text('Multi-Hop Query');
    sidebarHeader
      .append('div')
      .attr('class', 'instruction')
      .text('Select an example multi-hop reasoning query.');

    const selection = this.promptsSel.append('div').classed('label', true);
    const select = selection.append('select');
    const isSelected = (d) => d === this.selectedExample;
    select
      .selectAll('options')
      .data(Object.keys(EXAMPLE_INFO))
      .enter()
      .append('option')
      .text(
        (d) => this.targetLayersGrid[0][0].experiments[d]['multihop_prompt'],
      ) // text showed in the menu
      .attr('value', (d) => d) // returned value
      .property('selected', (d) => isSelected(d));

    const that = this;
    select.on('change', function () {
      const newValue = d3.select(this).property('value');
      that.handleExampleClick(newValue);
    });

    Object.keys(EXAMPLE_INFO).map((idx) => this.renderExample(idx));
  }

  renderLegend() {
    Object.entries(LEGEND_INFO).map(([k, v]) => {
      const entry = this.legendSel.append('div').classed('legend-entry', true);
      entry.append('div').classed('icon', true).style('background', v);
      entry.append('div').text(k);
    });
  }

  renderRightSidebar() {
    this.rightTokenSel = d3
      .select(this.containerElem)
      .append('div')
      .attr('class', 'sidebar-container');
    const sidebar = this.rightTokenSel.append('div').attr('class', 'sidebar');
    const sidebarHeader = sidebar.append('div').attr('class', 'sidebar-header');
    sidebarHeader
      .append('div')
      .attr('class', 'section-title')
      .text('Patched Multi-Hop Outputs');
    sidebarHeader
      .append('div')
      .attr('class', 'instruction')
      .text(
        'Explore how successfully the model is able to self-correct as source and target layers change.',
      );

    this.patchedTokenSel = sidebar
      .append('div')
      .classed('patched-container', true)
      .classed('multihop-container', true)
      .attr('data-role', 'multihop-section');

    const patchedSection = this.patchedTokenSel;

    const patchedOutputs = patchedSection;

    const sourcePrompt = patchedOutputs
      .append('div')
      .classed('source-prompt', true);
    sourcePrompt.append('div').attr('class', 'label').text('Multi-Hop Query');
    sourcePrompt
      .append('span')
      .classed('start', true)
      .text(() => {
        return this.experimentIndex < 10
          ? 'The largest city in '
          : 'The capital of ';
      });
    sourcePrompt
      .append('span')
      .classed('target-highlighted', true)
      .classed('food', true)
      .text(EXAMPLE_INFO[this.experimentIndex]['source']);
    sourcePrompt.append('span').classed('end', true).text(' country of ');

    sourcePrompt
      .append('span')
      .classed('source-highlighted', true)
      .text('origin');
    const baselineSection = patchedOutputs
      .append('div')
      .attr('class', 'line output baseline');

    baselineSection.append('div').attr('class', 'label').text('Baseline');
    const baseline = baselineSection
      .append('span')
      .attr('class', 'token-container baseline');
    this.initTokens(
      baseline,
      this.processTokens(this.currentExperiment['multihop_generation']),
      EXAMPLE_INFO[this.experimentIndex]['incorrect'],
      false,
    );

    const patchingSection = patchedOutputs
      .append('div')
      .attr('class', 'line output patching');
    patchingSection
      .append('div')
      .attr('class', 'label patch')
      .text(
        'Patching from source layer ' +
          (this.hoveredSourceLayer ?? this.selectedSourceLayer) +
          ' to target layer ' +
          (this.hoveredTargetLayer ?? this.selectedTargetLayer),
      );

    this.patchedSel = patchingSection
      .append('span')
      .classed('token-container', true);
    const falsePos = EXAMPLE_INFO[this.experimentIndex]['false_pos'];
    const sourceToTarget =
      (this.hoveredSourceLayer ?? this.selectedSourceLayer) +
      '-' +
      (this.hoveredTargetLayer ?? this.selectedTargetLayer);
    const isFalsePos = falsePos.includes(sourceToTarget);

    this.initTokens(
      this.patchedSel,
      this.patchedTokens,
      EXAMPLE_INFO[this.experimentIndex]['correct_city'],
      true,
      isFalsePos,
    );
  }

  /**
   * Callback handler invoked when the user clicks on any cell of the table.
   * @param {Object} datum Data object bound to the clicked element.
   */
  handleExampleClick(experimentIndex) {
    this.experimentIndex = experimentIndex;

    this.currentPrompt =
      this.targetLayersGrid[0][0].experiments[this.experimentIndex][
        'multihop_prompt'
      ];

    Object.keys(EXAMPLE_INFO).map((idx) => {
      const prompt = this.promptsSel.select('#example-' + idx.toString());
      prompt.style('display', this.experimentIndex !== idx ? 'none' : 'flex');
    });

    this.update();
  }

  /**
   * Callback handler invoked when the user hovers a table cell.
   * @param {Object} datum Data object bound to the clicked element.
   * @param {number} datum.sourceLayer Index of the selected source layer.
   * @param {number} datum.targetLayer Index of the selected source layer.
   */
  handleCellMouseover(datum) {
    let needsUpdate = false;
    if ('sourceLayer' in datum) {
      this.hoveredSourceLayer = datum.sourceLayer;
      needsUpdate = true;
    }
    if ('targetLayer' in datum) {
      this.hoveredTargetLayer = datum.targetLayer;
      needsUpdate = true;
    }
    if ('experiment' in datum) {
      this.currentExperiment = experiment[this.experimentIndex];
      needsUpdate = true;
    }
    if (needsUpdate) {
      this.update();
    }
  }

  renderGrid() {
    var gridData = this.targetLayersGrid;
    // set the dimensions and margins of the graph

    var width = GRID_WIDTH - HEATMAP_MARGINS.left - HEATMAP_MARGINS.right;
    var height = GRID_WIDTH - HEATMAP_MARGINS.top - HEATMAP_MARGINS.bottom;

    // append the svg object to the body of the page
    var svg = this.tableSel
      .append('svg')
      .attr('width', width + HEATMAP_MARGINS.left + HEATMAP_MARGINS.right)
      .attr('height', height + HEATMAP_MARGINS.top + HEATMAP_MARGINS.bottom)
      .attr('class', 'heatmap')
      .append('g')
      .attr(
        'transform',
        'translate(' + HEATMAP_MARGINS.left + ',' + HEATMAP_MARGINS.top + ')',
      );

    const layers = [...Array(ACCURACY_GRID_SIZE).keys()];

    const xScale = d3
      .scaleLinear()
      .domain([0, ACCURACY_GRID_SIZE])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, ACCURACY_GRID_SIZE])
      .range([height - GRID_CELL_SIZE + 1, -GRID_CELL_SIZE + 1]);

    var row = svg
      .selectAll('.row')
      .data(gridData)
      .enter()
      .append('g')
      .attr('class', 'row');

    row
      .selectAll('.square')
      .data((d) => d)
      .enter()
      .append('rect')
      .attr('class', 'square')
      .attr('x', (d) => xScale(d.sourceLayer))
      .attr('y', (d) => yScale(d.targetLayer))
      .attr('width', GRID_CELL_SIZE)
      .attr('height', GRID_CELL_SIZE)
      .style('fill', (d) => this.getGridFillColor(d))
      .on('click', (d) => this.handleCellClick(d))
      .on('mouseover', (d) => {
        this.handleCellMouseover(d);
      })
      .on('mouseout', () => {
        this.hoveredSourceLayer = undefined;
        this.hoveredTargetLayer = undefined;
        this.update();
      });

    // Build X scales and axis:
    var x = d3.scaleBand().range([0, width]).domain(layers).padding(0.01);
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x));

    // Build X scales and axis:
    var y = d3.scaleBand().range([height, 0]).domain(layers).padding(0.01);
    svg.append('g').attr('class', 'axis').call(d3.axisLeft(y));

    svg
      .append('text')
      .attr('class', 'x axis-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('x', width / 2)
      .attr('y', height + (ENTITY_MARGINS.bottom / 2) * 3)
      .text('Source Layer');
    svg
      .append('text')
      .attr('class', 'y axis-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('y', (-HEATMAP_MARGINS.left * 2) / 3 - 5)
      .attr('x', -width / 2)
      .attr('dy', '1em')
      .attr('transform', 'rotate(-90)')
      .text('Target Layer');
    this.renderEntityWidget();
  }
  renderEntityGraph(container) {
    var gridData = this.entityData[this.currentPrompt].map((d) => d[39]);
    // set the dimensions and margins of the graph

    var width = GRID_WIDTH - HEATMAP_MARGINS.left - HEATMAP_MARGINS.right;
    var height =
      GRID_CELL_SIZE * 4 - ENTITY_MARGINS.top - ENTITY_MARGINS.bottom;
    const layers = [...Array(ACCURACY_GRID_SIZE).keys()];

    // append the svg object to the body of the page
    var svg = container
      .append('svg')
      .attr('width', width + ENTITY_MARGINS.left + ENTITY_MARGINS.right)
      .attr('height', height + ENTITY_MARGINS.top + ENTITY_MARGINS.bottom)
      .attr('class', 'entitymap')
      .attr('border', '1px solid black')
      .append('g')
      .attr(
        'transform',
        'translate(' + ENTITY_MARGINS.left + ',' + ENTITY_MARGINS.top + ')',
      );

    const xScale = d3
      .scaleLinear()
      .domain([0, ACCURACY_GRID_SIZE])
      .range([0, width]);

    svg
      .selectAll('.square')
      .data(gridData)
      .enter()
      .append('rect')
      .attr('class', 'square')
      .attr('x', (d, i) => xScale(i))
      .attr('y', 0)
      .attr('width', GRID_CELL_SIZE)
      .attr('height', GRID_CELL_SIZE)
      .style('fill', (d, i) => this.getEntityGridFillColor(d, i));

    var x = d3.scaleBand().range([0, width]).domain(layers).padding(0.01);
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + GRID_CELL_SIZE + ')')
      .call(d3.axisBottom(x));
  }

  renderEntityWidget() {
    this.entitySel = this.tableSel
      .append('div')
      .attr('class', 'grid')
      .style('width', () => GRID_WIDTH + 'px');
    const sidebar = this.entitySel.append('div').attr('class', 'entity-widget');

    this.entityTokenSel = sidebar
      .append('div')
      .classed('entity-container', true);

    const patchedSection = this.entityTokenSel
      .append('div')
      .attr('data-role', 'entity-section')
      .classed('multihop-container', true);
    const patchedOutputs = patchedSection
      .append('div')
      .classed('entity-container line output entity', true);
    const header = patchedOutputs
      .append('div.label')
      .classed('entity', true)
      .style('display', 'flex')
      .style('flex-direction', 'row')
      .style('gap', '2px');
    header.append('div').text('Entity description at source layer ');
    header
      .append('span')
      .attr('class', 'entity-info')
      .text(this.hoveredSourceLayer ?? this.selectedSourceLayer);

    this.renderEntityGraph(patchedOutputs);

    this.entitySel = patchedOutputs
      .append('span')
      .classed('token-container', true);

    this.initTokens(
      this.entitySel,
      this.entityTokens,
      EXAMPLE_INFO[this.experimentIndex]['correct_country'],
      true,
    );
  }

  getEntityGridFillColor(d, i) {
    const clicked = i === this.selectedSourceLayer;
    if (clicked) return 'var(--pair-accent-pink-neon)';
    const hoveredColumn = i === this.hoveredSourceLayer;
    if (hoveredColumn) return 'var(--pair-accent-pink-light)';
    const correctCountries =
      EXAMPLE_INFO[this.experimentIndex]['correct_country'];

    const correct = d
      .slice(0, ENTITY_TRUNCATE_INDEX)
      .some((v) => correctCountries.includes(v))
      ? 1
      : 0;
    const r = 103;
    const g = 24;
    const b = 175;
    const a = correct * 7;
    const color = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    return color;
  }

  /**
   * Update visualization elements in response to user interaction.
   */
  update() {
    this.currentExperiment =
      this.targetLayersGrid[
        this.hoveredTargetLayer ?? this.selectedTargetLayer
      ][this.hoveredSourceLayer ?? this.selectedSourceLayer].experiments[
        this.experimentIndex
      ];
    this.patchedTokenSel.select('.start').text(() => {
      return this.experimentIndex < 10
        ? 'The largest city in '
        : 'The capital of ';
    });

    this.patchedTokenSel
      .select('.food')
      .text(EXAMPLE_INFO[this.experimentIndex]['source']);

    this.patchedTokens = (
      this.currentExperiment['patched_generation'].split(' ') || []
    ).map((id) => ({id}));

    this.entityTokens = this.entityData[this.currentPrompt][
      this.hoveredSourceLayer ?? this.selectedSourceLayer
    ][39]
      .map((id) => ({id}))
      .slice(0, ENTITY_TRUNCATE_INDEX);

    this.entityTokenSel
      .select('.entity-info')
      .text(this.hoveredSourceLayer ?? this.selectedSourceLayer);

    this.patchedTokenSel
      .select('.multihop-container')
      .select('.food')
      .text(EXAMPLE_INFO[this.experimentIndex]['source']);
    const baseline = this.patchedTokenSel
      .select('.baseline')
      .select('.token-container');
    this.updateTokens(
      baseline,
      this.processTokens(this.currentExperiment['multihop_generation']),
      EXAMPLE_INFO[this.experimentIndex]['incorrect'].split(' '),
      false,
    );

    this.patchedTokenSel
      .select('.patch')
      .text(
        'Patching from source layer ' +
          (this.hoveredSourceLayer ?? this.selectedSourceLayer) +
          ' to target layer ' +
          (this.hoveredTargetLayer ?? this.selectedTargetLayer),
      );
    this.patchedTokenSel
      .select('.entity .label')
      .text(
        'Entity description at source layer ' +
          (this.hoveredSourceLayer ?? this.selectedSourceLayer),
      );

    const falsePos = EXAMPLE_INFO[this.experimentIndex]['false_pos'];
    const sourceToTarget =
      (this.hoveredSourceLayer ?? this.selectedSourceLayer) +
      '-' +
      (this.hoveredTargetLayer ?? this.selectedTargetLayer);
    const isFalsePos = falsePos.includes(sourceToTarget);
    this.updateTokens(
      this.patchedSel,
      this.patchedTokens,
      EXAMPLE_INFO[this.experimentIndex]['correct_city'],
      true,
      isFalsePos,
    );

    this.updateTokens(
      this.entitySel,
      this.entityTokens,
      EXAMPLE_INFO[this.experimentIndex]['correct_country'],
      true,
    );

    this.tableSel
      .select('.heatmap')
      .selectAll('.row')
      .selectAll('rect')
      .data((d) => d)
      .style('fill', (d) => this.getGridFillColor(d));

    this.tableSel
      .select('.entitymap')
      .selectAll('rect')
      .data(this.entityData[this.currentPrompt].map((d) => d[39]))
      .style('fill', (d, i) => this.getEntityGridFillColor(d, i));
  }

  initTokens(
    sel,
    tokens,
    answer = undefined,
    isCorrect = true,
    falsePos = false,
  ) {
    const correctnessClass = isCorrect ? 'correct' : 'incorrect';
    sel
      .selectAll('span')
      .data(tokens.slice(0, TRUNCATE_INDEX))
      .enter()
      .append('span')
      .attr('data-token-id', ({id}) => id)
      .attr(
        'class',
        (d) =>
          'token ' +
          (answer?.includes(d.id) && d.id.length > 0 && !falsePos
            ? correctnessClass
            : ''),
      )
      .text(({id}) => id);
  }

  updateTokens(
    sel,
    tokens,
    answer = undefined,
    isCorrect = true,
    falsePos = false,
  ) {
    const correctnessClass = isCorrect ? 'correct' : 'incorrect';
    const updatedTokenSel = sel
      .selectAll('span')
      .data(tokens.slice(0, TRUNCATE_INDEX));

    updatedTokenSel
      .enter()
      .append('span')
      .merge(updatedTokenSel)
      .attr('data-token-id', ({id}) => id)
      .attr(
        'class',
        (d) =>
          'token ' +
          (answer?.includes(d.id) && d.id.length > 0 && !falsePos
            ? correctnessClass
            : ''),
      )
      .text(({id}) => id);
  }

  getGridFillColor(d) {
    const falsePos = EXAMPLE_INFO[this.experimentIndex]['false_pos'].includes(
      d.sourceLayer + '-' + d.targetLayer,
    );
    const correct =
      this.targetLayersGrid[d.targetLayer][d.sourceLayer].experiments[
        this.experimentIndex
      ]['patched_correct'] && !falsePos;
    const clicked =
      d.sourceLayer === this.selectedSourceLayer &&
      d.targetLayer === this.selectedTargetLayer;
    if (clicked) return 'var(--pair-accent-pink-neon)';
    const hovered =
      d.sourceLayer === this.hoveredSourceLayer &&
      d.targetLayer === this.hoveredTargetLayer;
    if (hovered) return 'var(--pair-accent-pink-light)';
    const hoveredColumn = d.sourceLayer === this.hoveredSourceLayer;
    const hoveredMultiplier = hoveredColumn ? 0.5 : 1;
    const accuracy = correct ? 1 : 0;
    const a = accuracy * hoveredMultiplier;
    if (!correct && hoveredColumn) return 'var(--pair-gray-200)';
    const r = 103;
    const g = 24;
    const b = 175;
    const color = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    return color;
  }
}

/**
 * Factory function that returns a callback to register vis.
 * The returned callback function will construct and initialize a `MultihopVis`.
 * @see MultihopVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's a `MultihopVis`.
 */
export function multihopVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `MultihopVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new MultihopVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
