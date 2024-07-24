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

const ALL_DATASETS = {
  'country_currency': [
    'Japan',
    'South Africa',
    'Hungary',
    'Czech Republic',
    'Indonesia',
    'Malaysia',
    'Mexico',
    'Switzerland',
    'India',
    'Turkey',
    'Saudi Arabia',
    'Argentina',
    'China',
  ],

  'fruit_inside_color': [
    'eggplants',
    'strawberries',
    'cherries',
    'avocados',
    'tomatoes',
    'pomegranates',
    'grapes',
  ],
  'fruit_outside_color': [
    'bananas',
    'raspberries',
    'blueberries',
    'zucchinis',
    'cherries',
    'apples',
    'avocados',
    'eggplants',
    'blackberries',
    'strawberries',
    'cucumbers',
    'pomegranates',
    'nectarines',
  ],
  'object_superclass': [
    'banana',
    'cucumber',
    'goose',
    'blue jay',
    'fish',
    'crow',
    'lizard',
    'toad',
    'tiger',
    'pear',
    'bass',
    'lion',
    'strawberry',
    'snake',
    'watermelon',
    'giraffe',
    'owl',
    'grapefruit',
    'hawk',
    'sparrow',
    'catfish',
    'turkey',
    'robin',
    'carp',
    'goldfish',
    'tilapia',
    'tuna',
    'orange',
    'carrot',
    'duck',
    'swordfish',
    'grapes',
    'mango',
    'peach',
    'spinach',
    'ostrich',
  ],
  'person_plays_pro_sport': [
    'Mickey Mantle',
    'Hugo Sánchez',
    'Sergei Makarov',
    'LeBron James',
    'Mariano Rivera',
    'Honus Wagner',
    'Bernie Casey',
    'Willie Mays',
    'Kevin Love',
    'Connie Mack',
    'Babe Ruth',
    'Viacheslav Fetisov',
    'Joe DiMaggio',
    'Emanuel Pogatetz',
    'Bob Hayes',
    'Phil Jackson',
    'Roberto Clemente',
    'Pete Rose',
    'Tim Cahill',
    'Red Grange',
    'Michael Bradley',
    'Peter Šťastný',
    'Raimo Helminen',
    'Mikaël Silvestre',
    'Cuauhtémoc Blanco',
    'Alexi Lalas',
    'John Olerud',
    'Lou Gehrig',
    'Ty Cobb',
    'Ilya Kovalchuk',
    'Abel Xavier',
    'Robbie Rogers',
    'Alessandro Nesta',
    'Youri Djorkaeff',
  ],
  //'person_plays_position_in_sport',
  'star_constellation': [
    'Delta Leonis',
    'Gamma Pegasi',
    'Deneb',
    'Vega',
    'Castor',
    'Algol',
    'Mu Persei',
    'Antares',
    'Rigel',
    'Spica',
    'Theta2 Orionis',
    'Aldebaran',
    '51 Pegasi',
    'Alpha Persei',
    'Iota Persei',
    'Betelgeuse',
    'Epsilon Pegasi',
    'X Persei',
  ],
  'substance_phase': [
    'ice cream',
    'beer',
    'wax',
    'argon',
    'mercury',
    'carbon dioxide',
    'radium',
    'copper',
    'gold',
    'silver',
    'lead',
    'ice',
    'juice',
    'wood',
    'silicon',
    'glass',
    'diamond',
    'salt',
    'ethanol',
    'tea',
    'soap',
    'kerosene',
    'nitrogen',
    'sugar',
    'wine',
    'aluminum',
    'platinum',
    'chocolate',
    'rubber',
    'vinegar',
    'butter',
    'neon',
    'steam',
    'petroleum',
    'olive oil',
    'plastic',
    'sulfur',
  ],
  'task_done_by_tool': [
    'playing basketball',
    'playing soccer',
    'washing clothes',
    'photography',
    'skateboarding',
    'playing sports',
    'dancing',
    'drilling holes',
    'flying a kite',
    'boating',
    'biking',
    'sawing wood',
  ],
};
/**
 *
 * @property {Element} containerElem Container element into which to render.
 */
class ProbingVsPatching {
  /**
   * Setup internal state members.
   */
  constructor() {
    /** Container element for this visualization */
    this.containerElem = null;
    /** Currently selected dataset */
    this.datasetName = null;
    /** Currently selected layer */
    this.selectedLayer = null;
    /** Currently selected example */
    this.selectedExample = null;
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
    this.containerElem = d3.select(containerElem);
    this.sourceDataDir = sourceDataDir;
    this.datasetName = 'country_currency';
    this.selectedLayer = 10;
    this.loadData();
  }

  async loadData() {
    const path = `${this.sourceDataDir}/${this.datasetName}.tsv`;
    const singlePath = `${this.sourceDataDir}/probing/${this.datasetName}.tsv`;
    const that = this;

    d3.queue()
      .defer(d3.tsv, singlePath)
      .defer(d3.tsv, path)
      .await(function (error, data1, data2) {
        if (error) throw error;
        that.dataByExample = that.getDataByExample(data1);
        that.accuracies = that.getAccuracies(data2);
        //that.dataByExample = dataByExample;
        // Set a CSS class on the container for styling.
        that.containerElem.classed(VIS_CLASS, true);
        that.numLayers = that.accuracies.length;
        that.render();
      });
  }

  getDataByExample(data) {
    const dataByExample = {};
    for (let row = 0; row < data.length; row++) {
      const rowData = data[row];

      // Do some light data cleaning
      const layer = parseInt(rowData.layer_source);
      const example = ALL_DATASETS[this.datasetName].includes(
        rowData['subject'],
      )
        ? rowData['subject']
        : '';

      if (!example) {
        continue;
      }

      // Set up the nested dict of data by example.
      if (!(example in dataByExample)) {
        dataByExample[example] = {};
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
    }
    this.selectedExample = [...Object.keys(dataByExample)][0];
    return dataByExample;
  }

  getAccuracies(data) {
    const answersByLayer = {};
    for (let row = 0; row < data.length; row++) {
      const rowData = data[row];

      // Do some light data cleaning
      const layer = parseInt(rowData.layer_source);
      const example = ALL_DATASETS[this.datasetName].includes(
        rowData['subject'],
      )
        ? rowData['subject']
        : '';

      if (!example) {
        continue;
      }

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
    return accuracies;
  }

  clearVis() {
    this.containerElem.selectAll('*').remove();
  }

  render() {
    this.clearVis();
    this.renderDatasetOptions();
    this.renderLineChart();
    this.renderExampleResults();
  }

  renderDatasetOptions() {
    // Add example options
    const isSelected = (d) => d === this.datasetName;
    const onChange = (newValue) => {
      this.datasetName = newValue;
      this.loadData();
    };

    const select = this.containerElem
      .append('div')
      .attr('class', 'small sidebar-container option-holder');
    const sidebar = select.append('div.sidebar');

    const header = sidebar.append('div.sidebar-header');
    header.append('div.section-title').html('Reasoning Tasks');
    header
      .append('div.instruction')
      .html('Select an example task to compare probing and patching outputs.');
    const optionsHolder = select.append(
      'div.options-probing probing-selection',
    );
    optionsHolder
      .selectAll('option')
      .data(Object.keys(ALL_DATASETS))
      .enter()
      .append('div')
      .classed('option', true)
      .html((d) => d.replaceAll('_', ' ')) // text showed in the menu
      .attr('value', (d) => d) // returned value
      .on('click', (d) => onChange(d))
      .classed('selected', (d) => isSelected(d));
  }

  /**
   *
   * @param {d3 selection} parent Selection to append the dropdown to.
   * @param {Array} data Array of strings to populate the dropdown.
   * @param {*} isSelected Callback for whether a given option is selected.
   * @param {*} onChange Callback for when the dropdown is updated.
   */
  makeDropdown(parent, data, isSelected, onChange) {
    // Add the options to the dropdown
    const select = parent.append('select');
    select
      .selectAll('options-probing')
      .data(data)
      .enter()
      .append('option')
      .text((d) => d.replaceAll('_', ' ')) // text showed in the menu
      .attr('value', (d) => d) // returned value
      .property('selected', (d) => isSelected(d));

    select.on('change', function () {
      const newValue = d3.select(this).property('value');
      onChange(newValue);
    });
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
      .html(`<div class='label'>${label}</div>${content}`);
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
    const isCorrectProbe = is_correct_probe;
    const isCorrectPatch = is_correct_patched;

    // Add the title for the RHS.
    const holder = this.containerElem
      .append('div')
      .classed('sidebar-container', true)
      .append('div')
      .classed('sidebar', true);
    holder
      .append('div')
      .classed('section-title', true)
      .html('Representative Example');

    // ExampleSelector line. First add a placeholder with an id we can later query and populate.
    const outputsTitle = `Outputs for <span id='options-holder'></span> at source layer ${this.selectedLayer}`;
    this.addLine(outputsTitle, '', holder, 'no-overflow');

    // Add example options dropdown to the placeholer div.
    const exampleHolder = d3.select('#options-holder');
    const examples = ALL_DATASETS[this.datasetName];
    const isSelected = (d) => d === this.selectedExample;
    const onChange = (newValue) => {
      this.selectedExample = newValue;
      this.render();
    };
    this.makeDropdown(exampleHolder, examples, isSelected, onChange);

    // Add correct answer line.
    const correctAnswer = `<span class="token correct"> ${correctChoice} </span>`;
    this.addLine('Correct answer', correctAnswer, holder, 'no-overflow');

    // Add patching result line.
    // If patching was correct, highlight the correct span.
    let patchingOutput = generations_patched_postprocessed.replace(/\s+/g, ' ');
    if (
      isCorrectPatch ||
      patchingOutput.toLowerCase().includes(correctChoice.toLowerCase())
    ) {
      const descriptionCorrect =
        'The output from patching, which contain the correct answer.';
      const span = `<span class='token correct' title=${descriptionCorrect}>${correctChoice}</span>`;
      // Regular expression to match a word that might have arbitrary spaces due to tokenization.
      const matchCorrectChoice = new RegExp(
        correctChoice.split('').join('\\s*'),
        'i',
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
    this.addLine('Patching', patchingContent, holder, 'output patching');

    // Add probing result.
    const probingClass = isCorrectProbe ? 'correct' : 'incorrect';
    const descriptionCorrect = `The probing output, which is ${probingClass}.`;
    const probingContent = `<span class="token ${probingClass}" title="${descriptionCorrect}"> ${predicted} </span>`;
    this.addLine('Probing', probingContent, holder, 'output probing');
  }

  /**
   * Render the line chart for average accuracies.
   */
  renderLineChart() {
    // Add title to LHS.
    const lineChartHolder = this.containerElem
      .append('div')
      .classed('table-container', true);

    const margin = 50;
    const width = 350 - margin * 1.5;
    const height = 375 - margin * 2;
    const padding = 5;
    this.svg = lineChartHolder
      .append('svg:svg')
      .attr('class', 'score-graph')
      .attr('width', width + margin * 1.5)
      .attr('height', height + margin * 2);
    const svg = this.svg
      .append('svg:g')
      .attr('transform', 'translate(' + margin + ',' + margin / 2 + ')');
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin / 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--pair-gray-800)')
      .text('Average Accuracy Across Examples')
      .style('font-weight', 'bold');

    // X and Y scales for layers and accuracy values to pixels.
    const x = d3.scaleLinear().domain([0, this.numLayers]).range([0, width]);
    // const maxAccuracy = d3.max(this.accuracies, d => Math.max(d.patching, d.probing) + 10);
    const maxAccuracy = 105;
    const y = d3.scaleLinear().domain([0, maxAccuracy]).range([height, 0]);

    // Add background
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'var(--pair-neutral-50)');

    // Add X axis
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x))
      .attr('class', 'axis');

    // Add X axis gridlines
    svg
      .selectAll('line.grid')
      .data(y.ticks())
      .enter()
      .append('line')
      .attr('class', 'grid')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', '#eee')
      .attr('stroke-width', '1px');

    // Add Y axis
    svg.append('g').call(d3.axisLeft(y)).attr('class', 'axis');

    // Add Y axis gridlines
    svg
      .selectAll('line.verticalGrid')
      .data(x.ticks())
      .enter()
      .append('line')
      .attr('class', 'verticalGrid')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('stroke', '#eee')
      .attr('stroke-width', '1px');

    // Add lines for patching and probing.
    const addDataLine = (accuracies, color, labelKey) => {
      const isHoveredLayer = (i) => this.selectedLayer === i;

      // Add the line for the scores
      svg
        .append('path')
        .datum(accuracies)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr(
          'd',
          d3
            .line()
            .x((d, i) => x(i))
            .y((d) => y(d)),
        );

      // Add the labels
      svg
        .selectAll(`text.${labelKey}`)
        .data(accuracies)
        .enter()
        .append('text')
        .attr('x', (d, i) => {
          // To avoid labels overflowing, align right for the last layers.
          if (i > this.accuracies.length - 3) {
            return x(i) - padding - 40;
          }
          return x(i) + padding;
        })
        .attr('y', (d) => y(d))
        .attr('font-size', 'smaller')
        .attr('font-weight', 'bold')
        .attr('visibility', (d, i) =>
          isHoveredLayer(i) ? 'visible' : 'hidden',
        )
        .text((d) => `${d.toFixed(1)}%`)
        .attr('fill', color);

      // Add circle indicators
      svg
        .selectAll(`circle.${labelKey}`)
        .data(accuracies)
        .enter()
        .append('circle')
        .attr('fill', color)
        .attr('visibility', (d, i) =>
          isHoveredLayer(i) ? 'visible' : 'hidden',
        )
        .attr('r', '3px')
        .attr('cx', (d, i) => x(i))
        .attr('cy', (d) => y(d));
    };
    const patchingAccuracies = Object.keys(this.accuracies).map(
      (x) => this.accuracies[x]['patching'],
    );
    const probingAccuracies = Object.keys(this.accuracies).map(
      (x) => this.accuracies[x]['probing'],
    );
    addDataLine(patchingAccuracies, '#6718af', 'patching'); //--pair-accent-purple-muted-neon
    addDataLine(probingAccuracies, 'goldenrod', 'probing');

    // Axes labels.
    const labelOffset = padding * 6;
    svg
      .append('text')
      .attr('class', 'y axis-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('y', -padding * 8)
      .attr('x', -width / 2)
      .attr('dy', '1em')
      .attr('transform', 'rotate(-90)')
      .text('Accuracy');

    svg
      .append('text')
      .attr('class', 'x axis-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('x', width / 2)
      .attr('y', height + padding * 6)
      .text('Source Layer');

    // Add the hover line
    svg
      .append('path')
      .attr('d', `M ${x(this.selectedLayer)} 0 V ${height}`)
      .attr('stroke', '#000')
      .attr('stroke-dasharray', '3 2');

    const that = this;
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('opacity', '0')
      .on('mousemove touchstart touchend', function () {
        let mouseX;
        if (d3.event.type === 'mousemove') {
          d3.event.preventDefault();
          mouseX = d3.mouse(this)[0];
        } else {
          mouseX = d3.touches(this)[0][0];
        }
        const layer = Math.max(Math.floor(x.invert(mouseX)), 0);
        if (that.selectedLayer != layer) {
          that.selectedLayer = layer;
          that.clearVis();
          that.render();
        }
      });
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
export function probingVsPatching() {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new ProbingVsPatching();
    const sourceDataDir = configJson.dataDir;
    return vis.init(containerElem, sourceDataDir);
  };
}
