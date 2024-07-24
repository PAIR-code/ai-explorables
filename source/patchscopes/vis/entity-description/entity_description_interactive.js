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
const MAX_CHARACTERS = 175;
const r = 103;
const g = 24;
const b = 175;

const ENTITY_TO_FILE = {
  'Abra, Ivory Coast': 'Abra,_Ivory_Coast_flat_data.json',
  'Abraham Lincoln': 'Abraham_Lincoln_flat_data.json',
  'Alexander the Great': 'Alexander_the_Great_flat_data.json',
  'Avatar': 'Avatar_flat_data.json',
  'Brandon Lee': 'Brandon_Lee_flat_data.json',
  'Breaking Bad': 'Breaking_Bad_flat_data.json',
  'Byzantine Empire': 'Byzantine_Empire_flat_data.json',
  'Chicche District': 'Chicche_District_flat_data.json',
  'Diana, Princess of Wales': 'Diana,_Princess_of_Wales_flat_data.json',
  'Doctor Who': 'Doctor_Who_flat_data.json',
  'Dubai': 'Dubai_flat_data.json',
  'Dubicze Osoczne': 'Dubicze_Osoczne_flat_data.json',
  'Edgar Allan Poe': 'Edgar_Allan_Poe_flat_data.json',
  'Elizabeth II': 'Elizabeth_II_flat_data.json',
  'European Union': 'European_Union_flat_data.json',
  'Finland': 'Finland_flat_data.json',
  'Game of Thrones': 'Game_of_Thrones_flat_data.json',
  'Gawarzec Dolny': 'Gawarzec_Dolny_flat_data.json',
  'George VI': 'George_VI_flat_data.json',
  'George Washington': 'George_Washington_flat_data.json',
  'Giuseppe Castelli': 'Giuseppe_Castelli_flat_data.json',
  'Gladiator': 'Gladiator_flat_data.json',
  'Gmina Radomsko': 'Gmina_Radomsko_flat_data.json',
  'Hatnagoda': 'Hatnagoda_flat_data.json',
  'James Bond': 'James_Bond_flat_data.json',
  'Kawahigashi Station': 'Kawahigashi_Station_flat_data.json',
  'Khvajeh Soheyl': 'Khvajeh_Soheyl_flat_data.json',
  'Lebanon': 'Lebanon_flat_data.json',
  'Los Angeles': 'Los_Angeles_flat_data.json',
  'Ma Xiu': 'Ma_Xiu_flat_data.json',
  'Marilyn Monroe': 'Marilyn_Monroe_flat_data.json',
  'Marvel Cinematic Universe': 'Marvel_Cinematic_Universe_flat_data.json',
  'Mary, Queen of Scots': 'Mary,_Queen_of_Scots_flat_data.json',
  'Michael Jackson': 'Michael_Jackson_flat_data.json',
  'Mr. Olympia': 'Mr._Olympia_flat_data.json',
  'Muhammad Ali': 'Muhammad_Ali_flat_data.json',
  'New Hampshire': 'New_Hampshire_flat_data.json',
  'New Jersey': 'New_Jersey_flat_data.json',
  'New Mexico': 'New_Mexico_flat_data.json',
  'New York': 'New_York_flat_data.json',
  'New York City': 'New_York_City_flat_data.json',
  'Nineteen Eighty-Four': 'Nineteen_Eighty-Four_flat_data.json',
  'North Carolina': 'North_Carolina_flat_data.json',
  'North Korea': 'North_Korea_flat_data.json',
  'One Piece': 'One_Piece_flat_data.json',
  'Papua New Guinea': 'Papua_New_Guinea_flat_data.json',
  "People's Republic of China": "People's_Republic_of_China_flat_data.json",
  'Puerto Rico': 'Puerto_Rico_flat_data.json',
  'Queen Victoria': 'Queen_Victoria_flat_data.json',
  'Rhode Island': 'Rhode_Island_flat_data.json',
  'Saturday Night Live': 'Saturday_Night_Live_flat_data.json',
  'Saudi Arabia': 'Saudi_Arabia_flat_data.json',
  'Selena Quintanilla': 'Selena_Quintanilla_flat_data.json',
  'Sri Lanka': 'Sri_Lanka_flat_data.json',
  'Star Wars': 'Star_Wars_flat_data.json',
  'The Matrix': 'The_Matrix_flat_data.json',
  'The Rolling Stones': 'The_Rolling_Stones_flat_data.json',
  'The Shining': 'The_Shining_flat_data.json',
  'United Arab Emirates': 'United_Arab_Emirates_flat_data.json',
  'United Kingdom': 'United_Kingdom_flat_data.json',
  'United States of America': 'United_States_of_America_flat_data.json',
  'Uttar Pradesh': 'Uttar_Pradesh_flat_data.json',
  'Valdearcos de la Vega': 'Valdearcos_de_la_Vega_flat_data.json',
};
const DATADIR =
  'https://storage.googleapis.com/uncertainty-over-space/explorables/patching/entity_postprocessed/';

/**
 * Flat grid visualization.
 *
 */
class EntityDescriptionInteractiveVis {
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

    this.tableSel = undefined;
    this.chartSel = undefined;
    this.sourcePromptSel = undefined;

    /**
     * Experiment data parsed from fetched response.
     * @type {ExperimentData}
     * @see init()
     */
    this.experimentData = new ExperimentData();

    this.exampleSelection = undefined;
    this.selectedEntity = undefined;

    this.selectedLayer = undefined;
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

    // Check the config for required fields.
    const {jsonDataUrl} = configJson;
    if (!jsonDataUrl || typeof jsonDataUrl !== 'string') {
      throw new Error('jsonDataUrl field is missing');
    }
    this.selectedEntity = 'Diana, Princess of Wales';
    this.jsonDataUrl = DATADIR + ENTITY_TO_FILE[this.selectedEntity];

    // Set a CSS class on the container for styling.
    containerElem.classList.add(ENTITY_DESCRIPTION_VIS_CLASS);

    // Loading...
    await loadProgressUntil(
      this.containerElem,
      this.fetcher
        .fetch(this.jsonDataUrl)
        .then((response) => response.text())
        .then((stringData) => void this.setupEntityData(stringData)),
    );

    // Once data is loaded and initialized, set up the visual elements.
    this.setupVis();
  }
  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  setupEntityData(stringData) {
    this.experimentData.initFromString('[' + stringData + ']', true);
  }

  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  setupData(stringData) {
    this.experimentData.initFromString('[' + stringData + ']', true);
  }

  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  async updateData(entity) {
    this.selectedEntity = entity;
    this.jsonDataUrl = DATADIR + ENTITY_TO_FILE[this.selectedEntity];
    this.experimentData = new ExperimentData();
    await this.fetcher
      .fetch(this.jsonDataUrl)
      .then((response) => response.text())
      .then((stringData) => void this.setupEntityData(stringData));

    this.update();
  }

  /**
   * Set up the visualization. Expects `setupData()` to have already been called
   * succesfully and ran to completion.
   * @see setupData()
   */
  setupVis() {
    const container = d3
      .select(this.containerElem)
      .append('div')
      .attr('class', 'container');

    const marilynButton = d3.select('.marilyn').on('click', () => {
      this.updateData('Marilyn Monroe');
    });
    const dubaiButton = d3.select('.dubai').on('click', () => {
      this.updateData('Dubai');
    });

    this.renderSidebar(container);
    this.renderTable(container);
  }

  updateSourcePrompt() {
    this.sourcePromptSel.select('.token-container').remove();
    d3.select('.wikipedia').text(
      this.experimentData.flatExperiments[0]['subj_desc'],
    );

    const tokenContainer = this.sourcePromptSel
      .append('div')
      .attr('class', 'token-container');

    tokenContainer
      .selectAll('div')
      .data(this.experimentData.flatExperiments[0]['tokenized_source'].slice(1))
      .enter()
      .append('div')
      .attr('class', 'token')
      .text((d) => d);
  }

  updateTable() {
    this.tableSel.remove();
    this.tableSel = d3
      .select('.right')
      .append('div')
      .attr('class', 'table nested');

    const tableContainer = this.tableSel
      .append('div')
      .classed('table-container', true);

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

    const rows = this.tableSel
      .selectAll('.row')
      .data(this.experimentData.flatExperiments.slice(0, TRUNCATE_INDEX))
      .enter()
      .append('div')
      .attr('class', 'row');
    rows
      .append('div')
      .classed('cell', true)
      .classed('source-cell', true)
      .text((d, i) => d['layer_source']);

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
      .text((d) => d['generations_cropped'].slice(0, MAX_CHARACTERS));
  }

  updateChart() {
    d3.selectAll('.entity-scores').remove();
    this.renderChart(d3.select('.right'));
  }

  update() {
    const options = d3
      .select(this.containerElem)
      .select('.options')
      .selectAll('.option');
    options.classed('selected', (d) => {
      return d === this.selectedEntity;
    });

    this.updateSourcePrompt();
    this.updateTable();
    this.updateChart();
  }

  renderSidebar(container) {
    const left = container
      .append('div')
      .attr('class', 'left sidebar-container');
    const header = left
      .append('div')
      .attr('class', 'sidebar')
      .append('div')
      .attr('class', 'sidebar-header');
    header.append('div').attr('class', 'section-title').text('Source Prompt');
    header
      .append('div')
      .attr('class', 'instruction')
      .text('Select an example to use as a source prompt');

    this.exampleSelection = left.append('div').attr('class', 'options');

    this.exampleSelection
      .selectAll('div')
      .data(Object.keys(ENTITY_TO_FILE))
      .enter()
      .append('div')
      .attr('class', 'option')
      .classed('selected', (d) => d === this.selectedEntity)
      .attr('value', (d) => d)
      .on('click', (d) => this.updateData(d))
      .text((d) => d);
  }
  parseScore(scoreString) {
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const appears = values.filter((d) => scoreString.includes(d.toString()));
    return Math.max(...appears);
  }
  renderChart(container) {
    var width = container.node().getBoundingClientRect().width;
    var m = [40, 10, 40, 2]; // margins
    var w = width - m[1] - m[3]; // width
    var h = 300 - m[0] - m[2]; // height

    // create a simple data array that we'll plot with a line (this array represents only the Y values, X will just be the index location)
    var data = this.experimentData.flatExperiments.map((i) =>
      this.parseScore(i['description_similarity_ratings_text']),
    );

    // X scale will fit all values from data[] within pixels 0-w
    var x = d3.scaleLinear().domain([0, data.length]).range([0, w]);
    // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
    var y = d3.scaleLinear().domain([0, 12]).range([h, 0]);
    // automatically determining max range can work something like this
    // var y = d3.scale.linear().domain([0, d3.max(data)]).range([h, 0]);

    // create a line function that can convert data[] into x and y points
    var line = d3
      .line()
      // assign the X function to plot our line as we wish
      .x((d, i) => x(i))
      .y((d) => y(d));

    // Add an SVG element with the desired dimensions and margin.
    this.chartSel = container
      .append('svg:svg')
      .attr('class', 'entity-scores')
      .attr('width', w + m[1] + m[3])
      .attr('height', h + m[0] + m[2])
      .append('svg:g')
      .attr('transform', 'translate(' + m[3] + ',' + m[0] + ')');

    this.chartSel
      .append('text')
      .attr('x', w / 2)
      .attr('y', 0 - m[0] / 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', 'var(--pair-gray-800)')
      .text('Entity Resolution Score Over Source Layers')
      .style('font-weight', 'bold');

    // create xAxis
    var xAxis = d3.axisBottom().scale(x);
    // Add the x-axis.
    this.chartSel
      .append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + h + ')')
      .call(xAxis);

    // Add X axis gridlines
    this.chartSel
      .selectAll('line.grid')
      .data(y.ticks())
      .enter()
      .append('line')
      .attr('class', 'grid')
      .attr('x1', 0)
      .attr('x2', w)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', '#eee')
      .attr('stroke-width', '1px');

    this.chartSel
      .append('text')
      .attr('class', 'x axis-label')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .attr('x', w / 2)
      .attr('y', h + m[0] / 1.5)
      .text('Source Layer');

    // Add Y axis gridlines
    this.chartSel
      .selectAll('line.verticalGrid')
      .data(x.ticks())
      .enter()
      .append('line')
      .attr('class', 'verticalGrid')
      .attr('y1', 0)
      .attr('y2', h)
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('stroke', '#eee')
      .attr('stroke-width', '1px');

    const addDataLine = (labelKey, color) => {
      const isHoveredLayer = (i) => this.selectedLayer === i;
      const labelPadding = 5;
      const width = w / 50;

      // Add the labels
      this.chartSel
        .selectAll(`text.${labelKey}`)
        .data(data)
        .enter()
        .append('text')
        .attr('x', (d, i) => {
          return x(i) + 1;
        })
        .attr('y', (d) => y(d) - 10)
        .attr('font-size', 'smaller')
        .attr('font-weight', 'bold')
        .attr('visibility', (d, i) =>
          isHoveredLayer(i) ? 'visible' : 'hidden',
        )
        .text((d, i) => `${d}`)
        .attr('fill', color);

      // Bars
      this.chartSel
        .selectAll('mybar')
        .data(data)
        .enter()
        .append(`rect.${labelKey}`)
        .attr('x', (d, i) => {
          return x(i) + 1;
        })
        .attr('y', (d) => y(d))
        .attr('width', width)
        .attr('height', function (d) {
          return h - y(d) + 0.5;
        })
        .attr('rx', '1px')
        .attr('fill', (d) => {
          const score = d / 10;
          const red = 255 * (1 - score) + r * score;
          const green = 255 * (1 - score) + g * score;
          const blue = 255 * (1 - score) + b * score;
          return 'rgb(' + red + ', ' + green + ', ' + blue + ')';
        })
        .attr('stroke', 'var(--pair-gray-600)')
        .attr('opacity', (d, i) => (isHoveredLayer(i) ? '100%' : '90%'));
    };
    addDataLine('scores', '#6718af');

    const that = this;
    this.chartSel
      .append('rect')
      .attr('width', w)
      .attr('height', h)
      .style('opacity', '0')
      .on('mousemove', function () {
        d3.event.preventDefault();
        const mouseX = d3.mouse(this)[0];
        const layer = Math.floor(x.invert(mouseX));
        if (that.selectedLayer != layer) {
          that.selectedLayer = layer;
          that.updateChart(container);
        }
      })
      .on('mouseout', () => {
        d3.event.preventDefault();
        this.selectedLayer = undefined;
        this.updateChart(container);
      });
  }

  renderTable(container) {
    const right = container.append('div').attr('class', 'right');
    const rightHeader = right
      .append('div')
      .attr('class', 'section-title tokenized-source');
    this.sourcePromptSel = rightHeader
      .append('div')
      .classed('source-prompt-tokens', true);
    this.sourcePromptSel
      .append('div')
      .attr('class', 'annotation')
      .text('Tokenized Source Prompt');

    const tokenContainer = this.sourcePromptSel
      .append('div')
      .attr('class', 'token-container');

    tokenContainer
      .selectAll('div')
      .data(this.experimentData.flatExperiments[0]['tokenized_source'].slice(1))
      .enter()
      .append('div')
      .attr('class', 'token')
      .text((d) => d);

    const description = rightHeader
      .append('div')
      .attr('class', 'section-title description');

    description
      .append('span')
      .classed('annotation', true)
      .text('Wikipedia Description: ');
    description
      .append('span')
      .classed('wikipedia', true)
      .text(this.experimentData.flatExperiments[0]['subj_desc']);

    this.tableSel = right.append('div').attr('class', 'table nested');

    const tableContainer = this.tableSel
      .append('div')
      .classed('table-container', true);

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

    const rows = this.tableSel
      .selectAll('.row')
      .data(this.experimentData.flatExperiments.slice(0, TRUNCATE_INDEX))
      .enter()
      .append('div')
      .attr('class', 'row');

    rows
      .append('div')
      .classed('cell', true)
      .classed('source-cell', true)
      .text((d, i) => d['layer_source']);

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
      .text((d) => d['generations_cropped'].slice(0, MAX_CHARACTERS));

    this.renderChart(right);
  }
}
/**
 * Factory function that returns a callback to register vis.
 * The returned callback function will construct and initialize a `FlatGridVis`.
 * @see FlatGridVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's an instance.
 */
export function entityDescriptionInteractiveVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new EntityDescriptionInteractiveVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
