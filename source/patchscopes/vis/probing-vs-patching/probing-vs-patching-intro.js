/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Visualization how information flows through the network from a token.
 */

/**
 * CSS class to assign to container for styling.
 */
const VIS_CLASS = 'probing-vs-patching';

const ACCURACY_GRID_SIZE = 27;
const TRUNCATE_INDEX = 10;
const ENTITY_TRUNCATE_INDEX = 10;
const GRID_WIDTH = 600; //px
const HEATMAP_MARGINS = {top: 10, right: 10, bottom: 40, left: 10};
const ENTITY_MARGINS = {top: 5, right: 5, bottom: 40, left: 5};
const GRID_CELL_SIZE =
  (GRID_WIDTH - HEATMAP_MARGINS.top - HEATMAP_MARGINS.bottom) /
  ACCURACY_GRID_SIZE;

/**
 *
 * @property {Element} containerElem Container element into which to render.
 */
class ProbingVsPatchingIntro {
  /**
   * Setup internal state members.
   */
  constructor() {
    /** Container element for this visualization */
    this.containerElem = null;
    /** Currently selected dataset */
    this.datasetName = 'country_largest_city';
    /** Currently selected layer */
    this.selectedLayer = 10;
    /** Currently selected example */
    this.selectedExample = 'Spain';
    /** All data, organized by example */
    this.dataByExample = null;
    /** Average accuracies per layer.*/
    this.accuracies = null;
    /** Parent directory containing the tsvs. */
    this.sourceDataDir = null;
  }

  /**
   * Perform initialization specific to config.
   * @param {Element} containerElem Container element into which to render.
   */
  async init(containerElem, sourceDataDir) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }
    this.containerElem = d3
      .select(containerElem)
      .attr('class', 'intro-probing');
    this.sourceDataDir = sourceDataDir;
    this.loadData();
  }

  loadData() {
    const path = `${this.sourceDataDir}/${this.datasetName}.tsv`;
    const that = this;

    d3.tsv(path, function (error, data) {
      const {accuracies, dataByExample} = that.parseData(data);

      that.dataByExample = dataByExample;
      // Set a CSS class on the container for styling.
      that.containerElem.classed(VIS_CLASS, true);
      that.numLayers = accuracies.length;
      that.accuracies = accuracies;
      that.render();
    });
  }

  parseData(data) {
    const answersByLayer = {};
    const dataByExample = {};
    for (let row = 0; row < data.length; row++) {
      const rowData = data[row];

      // Do some light data cleaning
      const layer = parseInt(rowData.layer_source);
      const example = rowData['subject'];
      if (!example) {
        continue;
      }

      // Set up the nested dict of data by example.
      if (!(example in dataByExample)) {
        dataByExample[example] = {};
        this.selectedExample = example;
      }
      if (!(layer in dataByExample[example])) {
        dataByExample[example][layer] = [];
      }
      dataByExample[example][layer].push(rowData);

      // Save the answers to calculate accuracies.
      // Do some light data cleaning.
      rowData['is_correct_patched'] = this.stringToBoolInt(
        rowData['is_correct_patched'],
      );
      rowData['is_correct_probe'] = this.stringToBoolInt(
        rowData['is_correct_probe'],
      );

      // Set up the answers dict
      if (!(layer in answersByLayer)) {
        answersByLayer[layer] = {
          'patch': [],
          'probe': [],
        };
      }
      answersByLayer[layer]['patch'].push(rowData['is_correct_patched']);
      answersByLayer[layer]['probe'].push(rowData['is_correct_probe']);
    }

    // Calculate average probing and parsing accuricies by layer.
    const accuracies = [];
    for (const [layer, layerAccuracies] of Object.entries(answersByLayer)) {
      const meanPatching =
        layerAccuracies.patch.reduce((partialSum, a) => partialSum + a, 0) /
        layerAccuracies.patch.length;
      const meanProbing =
        layerAccuracies.probe.reduce((partialSum, a) => partialSum + a, 0) /
        layerAccuracies.probe.length;
      accuracies.push({
        'patching': meanPatching * 100,
        'probing': meanProbing * 100,
      });
    }

    // Get the accuracies and datas
    return {accuracies, dataByExample};
  }

  clearVis() {
    this.containerElem.selectAll('*').remove();
  }

  render() {
    this.selectedExample = 'Spain';
    this.clearVis();
    this.renderExampleResults();
    this.renderLineChart();
  }

  /**
   * Add a single line with a label and content.
   * @param {string} label Arbitrary HTML to format as the label. Usually a single string.
   * @param {string} content Arbitrary HTML to add to the body content of the line.
   * @param {d3 selection} container D3 selection to append the line.
   * @param {string} otherHolderClasses Additional classes for the holder. Space delimited string.
   */
  addLine(label, content, container, otherHolderClasses = '') {
    container
      .append('div')
      .classed(`line ${otherHolderClasses}`, true)
      .html(`<div class='label intro'>${label}</div>${content}`);
  }

  /**
   * Render the patching and probing outputs for a single example.
   */
  renderExampleResults() {
    const example =
      this.dataByExample[this.selectedExample][this.selectedLayer][0];
    let {
      object,
      subject,
      generations_patched_postprocessed,
      prompt_target,
      predicted,
      is_correct_probe,
      is_correct_patched,
    } = example;

    // Renaming for clarity. Also some minor data cleaning.
    const correctChoice = object;
    const promptTarget = prompt_target.replace('x', subject);
    const isCorrectPatch = is_correct_patched;

    // Add the title for the RHS.
    const holder = this.containerElem
      .append('div')
      .classed('header-container', true)
      .append('div')
      .attr('class', 'section-header probing-intro');
    const tableContainer = this.containerElem.select('.table-container');

    // ExampleSelector line. First add a placeholder with an id we can later query and populate.
    const patchingSource = ['The largest city in', 'Spain'];

    // Add correct answer line.
    const correctAnswer = `<div class='token-container'><span class="token correct"> ${correctChoice} </span></div>`;
    const examplePrompt = `<div class='token-container highlight'><span class="token target"> The largest city in </span><span class="token target">x</span></div>`;
    const source = `<div class='token-container'><span class="token">Spain</span></div>`;
    this.addLine('Source Prompt', source, holder, 'intro-header');
    this.addLine('Inspection Prompt', examplePrompt, holder, 'intro-header');
    this.addLine('Correct answer', correctAnswer, holder, 'intro-header');
  }

  /**
   * Render the line chart for average accuracies.
   */
  renderLineChart() {
    // Add title to LHS.
    const lineChartHolder = this.containerElem
      .append('div')
      .attr('class', 'table-container intro');
    const correct = Object.keys(this.dataByExample[this.selectedExample]).map(
      (layer) =>
        this.dataByExample[this.selectedExample][layer][0][
          'is_correct_patched'
        ] == 1
          ? 1
          : -1,
    );

    var gridData = correct;
    // set the dimensions and margins of the graph

    var width = GRID_WIDTH - HEATMAP_MARGINS.left - HEATMAP_MARGINS.right;
    var height =
      GRID_CELL_SIZE * 4 - ENTITY_MARGINS.top - ENTITY_MARGINS.bottom;
    const layers = [...Array(ACCURACY_GRID_SIZE).keys()];

    // append the svg object to the body of the page
    var svg = lineChartHolder
      .append('svg')
      .attr('width', width + ENTITY_MARGINS.left + ENTITY_MARGINS.right)
      .attr('height', height + ENTITY_MARGINS.top + ENTITY_MARGINS.bottom)
      .attr('class', 'score-graph intro')
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
      .style('fill', (d, i) =>
        d == 1
          ? 'var(--pair-accent-teal-neon-light)'
          : 'var(--pair-accent-pink-neon-light)',
      )
      .style('stroke', (d, i) => {
        const color =
          d == 1
            ? 'var(--pair-accent-teal-dark)'
            : 'var(--pair-accent-pink-dark)';
        return color;
      })
      .style('opacity', (d, i) => (i == this.selectedLayer ? '100%' : '50%'))
      .on('mouseover', (d, i) => {
        this.selectedLayer = i;
        this.render();
      });

    var x = d3.scaleBand().range([0, width]).domain(layers).padding(0.01);
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + GRID_CELL_SIZE + ')')
      .call(d3.axisBottom(x));

    svg
      .append('text')
      .attr('class', 'x axis-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('x', width / 2)
      .attr('y', height + ENTITY_MARGINS.bottom / 3)
      .text('Source Layer');

    const example =
      this.dataByExample[this.selectedExample][this.selectedLayer][0];
    let {
      object,
      subject,
      generations_patched_postprocessed,
      prompt_target,
      predicted,
      is_correct_probe,
      is_correct_patched,
    } = example;

    const correctChoice = object;
    const promptTarget = prompt_target.replace('x', subject);
    const isCorrectPatch = is_correct_patched;

    // Add patching result line.
    // If patching was correct, highlight the correct span.
    let patchingOutput = generations_patched_postprocessed.replace(/\s+/g, ' ');
    if (isCorrectPatch) {
      const descriptionCorrect =
        'The output from patching, which contain the correct answer.';
      const span = `<span class='token correct' title=${descriptionCorrect}>${correctChoice}</span>`;
      // Regular expression to match a word that might have arbitrary spaces due to tokenization.
      const matchCorrectChoice = new RegExp(
        correctChoice.split('').join('\\s*'),
      );
      patchingOutput = patchingOutput.replace(matchCorrectChoice, span);
    }
    // If patching was incorrect, highlight the entire span in red.
    else {
      const descriptionIncorrect =
        'The output from patching, which did not contain the correct answer.';
      patchingOutput = `<span class='incorrect token' title="${descriptionIncorrect}"> ${patchingOutput}</span>`;
    }
    const patchingContent = `
     <span class='patching-full-text'>
         <span class='prompt-target'>${promptTarget}</span>
         <span class="patching-outputs"> ${patchingOutput} </span>
     </span>`;
    this.addLine(
      `Generated text from patching at source layer ${this.selectedLayer}`,
      patchingContent,
      lineChartHolder,
      'output patching intro',
    );
  }

  /**
   * Parses a string form of a boolean to either a 1 or 0.
   */
  stringToBoolInt(string) {
    if (!['True', 'False'].includes(string)) {
      console.error(`Could not parse ${string} as boolean.`);
    }
    return string == 'True' ? 1 : 0;
  }
}

/**
 * Callback function to register. Construct and initialize a `ProbingVsPatching`.
 * @see ProbingVsPatching.
 * @param {Element} containerElem Container element into which to render.
 * @param {Object} configJson Configuration JSON object.
 */
export function probingVsPatchingIntro() {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new ProbingVsPatchingIntro();
    const sourceDataDir = configJson.dataDir;
    return vis.init(containerElem, sourceDataDir);
  };
}
