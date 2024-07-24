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
const TOP_100_SCORES = [
  2.355223880597015, 3.6507462686567163, 4.161194029850746, 4.391044776119403,
  4.594029850746269, 4.51044776119403, 4.056716417910447, 3.9313432835820894,
  3.7940298507462686, 3.4686567164179105, 3.3492537313432837, 3.361194029850746,
  3.662686567164179, 3.62089552238806, 3.719402985074627, 3.453731343283582,
  3.435820895522388, 3.5014925373134327, 3.5761194029850745, 3.292537313432836,
  3.3402985074626868, 3.1552238805970148, 3.208955223880597, 3.1134328358208956,
  2.8865671641791044, 2.8537313432835822, 2.7701492537313435, 2.626865671641791,
  2.638805970149254, 2.4119402985074627, 2.2, 2.2507462686567163,
  2.2776119402985073, 2.065671641791045, 1.973134328358209, 1.7164179104477613,
  1.6746268656716419, 1.5492537313432835, 1.3940298507462687,
  1.5582089552238807,
];

const DIANA_SCORES = [
  1, 1, 1, 7, 2, 7, 2, 9, 9, 1, 8, 9, 8, 8, 9, 8, 8, 2, 8, 8, 3, 1, 1, 7, 2, 2,
  1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
];
const TOP_100_TEXT =
  'If we take the average score across the Top 100 most popular entities, a more general pattern emerges: the accuracy of the entity description generations tends to peak in the early source layers, before displaying a notable drop in quality at later layers.';
const DIANA_TEXT =
  'For Diana, we see critical inflections early on (layers 3 and 5) where the model starts to resolve attributes of this person before the entity is properly resolved at layer 7. In this specific instance, that resolution appears to be fairly stable through middle layers of the model, though this is not always the case.';
const m = [40, 10, 40, 10];
const width = 600;
const height = 300;

/**
 * Flat grid visualization.
 *
 */
class EntityDescriptionScoresVis {
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
    this.scores = undefined;
    this.chartSel = undefined;
    this.selectionSel = undefined;
    this.selectedLayer = undefined;
    this.selectedExample = undefined;

    /**
     * Experiment data parsed from fetched response.
     * @type {ExperimentData}
     * @see init()
     */
    this.experimentData = new ExperimentData();
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
    if (
      (!jsonDataUrl || typeof jsonDataUrl !== 'string') &&
      !configJson.rawData
    ) {
      throw new Error('jsonDataUrl field is missing');
    }
    this.jsonDataUrl = jsonDataUrl;
    // Set a CSS class on the container for styling.
    containerElem.classList.add(ENTITY_DESCRIPTION_VIS_CLASS);

    // Once data is loaded and initialized, set up the visual elements.
    this.setupVis();
    this.selectedExample = 'diana';
  }
  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  setupData(stringData) {
    this.experimentData.initFromString(stringData);
  }

  /**
   * Set up the visualization. Expects `setupData()` to have already been called
   * succesfully and ran to completion.
   * @see setupData()
   */
  setupVis() {
    d3.select(this.containerElem).classed('container', true);
    this.renderSelections();
    this.renderChart();
  }
  renderSelections() {
    this.selectionSel = d3
      .select(this.containerElem)
      .append('div')
      .classed('score-selection', true);
    const header = this.selectionSel
      .append('div')
      .classed('score-header', true);
    header
      .append('div')
      .attr('class', 'title diana')
      .text('Diana')
      .style('border-bottom', '2px solid var(--pair-accent-purple-muted-neon)');

    header.append('div').attr('class', 'title top-100').text('Top 100');

    this.selectionSel
      .append('div')
      .classed('score-explanation', true)
      .text(DIANA_TEXT);
  }
  renderChart() {
    // create a simple data array that we'll plot with a line (this array represents only the Y values, X will just be the index location)
    var data = DIANA_SCORES;

    // Add an SVG element with the desired dimensions and margin.
    const graphContainer = d3
      .select(this.containerElem)
      .append('div')
      .attr('class', `scores-container`);
    const w = graphContainer.node().getBoundingClientRect().width - m[1] - m[3]; // width
    const h = w / 2; // height
    const barWidth = w / 50;
    // X scale will fit all values from data[] within pixels 0-w
    var x = d3.scaleLinear().domain([0, data.length]).range([0, w]);
    // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
    var y = d3.scaleLinear().domain([0, 12]).range([h, 0]);
    // create a line function that can convert data[] into x and y points

    var graph = graphContainer
      .append('svg:svg')
      .attr('class', 'score-graph intro')
      .attr('width', w + m[1] + m[3])
      .attr('height', h + m[0] + m[2])
      .append('svg:g')
      .attr('transform', 'translate(' + m[3] + ',' + m[0] + ')');
    d3.selectAll('.diana').on('click', () => {
      this.selectedExample = 'diana';
      this.updateData(graph, 'diana', DIANA_SCORES, [103, 24, 175], 1000, 0);
    });
    d3.selectAll('.top-100').on('click', (g) => {
      this.selectedExample = 'top-100';
      this.updateData(
        graph,
        'top-100',
        TOP_100_SCORES,
        [100, 137, 120],
        1000,
        2,
      );
    });
    graph
      .append('text')
      .attr('x', w / 2)
      .attr('y', 0 - m[0] / 4)

      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', 'var(--pair-gray-800)')
      .text('Entity Resolution Score Over Source Layers')
      .style('font-weight', 'bold');

    // create yAxis
    var xAxis = d3.axisBottom().scale(x);
    // Add the x-axis.
    graph
      .append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + h + ')')
      .call(xAxis);
    graph
      .append('text')
      .attr('class', 'x axis-label')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .attr('x', w / 2)
      .attr('y', h + m[0] / 1.5)
      .text('Source Layer');

    graph
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
    graph
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

    this.updateData(graph, 'diana', DIANA_SCORES, [103, 24, 175], 1000, 0);
  }
  // A function that create / update the plot for a given variable:
  updateData(graph, labelKey, data, color, transition = 1000, places = 2) {
    const dianaSel = this.selectionSel.select('.diana');
    const top100Sel = this.selectionSel.select('.top-100');
    const explanation = this.selectionSel.select('.score-explanation');
    if (this.selectedExample == 'diana') {
      dianaSel.style(
        'border-bottom',
        '2px solid var(--pair-accent-purple-muted-neon)',
      );
      top100Sel.style('border-bottom', 'none');
      explanation.text(DIANA_TEXT);
    } else if (this.selectedExample == 'top-100') {
      top100Sel.style('border-bottom', '2px solid var(--pair-neutral-500)');
      dianaSel.style('border-bottom', 'none');
      explanation.text(TOP_100_TEXT);
    }
    const w =
      d3
        .select(this.containerElem)
        .select('.scores-container')
        .node()
        .getBoundingClientRect().width -
      m[1] -
      m[3]; // width
    const h = w / 2; // height
    const barWidth = w / 50;

    const isHoveredLayer = (i) => this.selectedLayer === i;
    const r = color[0];
    const g = color[1];
    const b = color[2];
    // X scale will fit all values from data[] within pixels 0-w
    var x = d3.scaleLinear().domain([0, data.length]).range([0, w]);
    // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
    var y = d3.scaleLinear().domain([0, 12]).range([h, 0]);

    // Create the u variable
    var u = graph.selectAll('rect').data(data);

    const bars = u
      .enter()
      .append('rect') // Add a new rect for each new elements
      .merge(u); // get the already existing elements as well
    bars
      .transition() // and apply changes to all of them
      .duration(transition)
      .attr('x', (d, i) => x(i) + 1)
      .attr('y', (d) => y(d))
      .attr('width', barWidth)
      .attr('height', function (d) {
        return h - y(d) + 1;
      })
      .attr('rx', '1px')
      .attr('fill', (d) => {
        const score = Math.max(d / 10, 0.02);
        const red = 255 * (1 - score) + r * score;
        const green = 255 * (1 - score) + g * score;
        const blue = 255 * (1 - score) + b * score;
        return 'rgb(' + red + ', ' + green + ', ' + blue + ')';
      })
      .attr('stroke', 'var(--pair-gray-600)')
      .attr('opacity', (d, i) => (isHoveredLayer(i) ? '100%' : '90%'));

    const labelPadding = 5;

    // Add the labels
    var v = graph.selectAll(`text.label`).data(data);
    const labels = v.enter().append('text.label').merge(v);
    labels
      .transition()
      .duration(transition)
      .attr('x', (d, i) => {
        return x(i) + 1;
      })
      .attr('y', (d) => y(d) - 10)
      .attr('font-size', 'smaller')
      .attr('font-weight', 'bold')
      .attr('visibility', (d, i) => (isHoveredLayer(i) ? 'visible' : 'hidden'))
      .text((d, i) => `${d.toFixed(places)}`)
      .attr('fill', `rgb(${r}, ${g}, ${b})`);

    u.exit().remove();
    v.exit().remove();
    const that = this;
    graph
      .append('rect')
      .attr('width', w)
      .attr('height', h)
      .attr('rx', '1px')
      .style('opacity', '0')
      .on('mousemove', function () {
        d3.event.preventDefault();
        const mouseX = d3.mouse(this)[0];
        const layer = Math.floor(x.invert(mouseX));
        if (that.selectedLayer != layer) {
          that.selectedLayer = layer;
          that.updateData(graph, labelKey, data, color, 5, places);
        }
      })
      .on('mouseout', function () {
        d3.event.preventDefault();
        that.selectedLayer = undefined;
        that.updateData(graph, labelKey, data, color, 5, places);
      });
  }
}
/**
 * Factory function that returns a callback to register vis.
 * The returned callback function will construct and initialize a `FlatGridVis`.
 * @see FlatGridVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's an instance.
 */
export function entityDescriptionScoresVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new EntityDescriptionScoresVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
