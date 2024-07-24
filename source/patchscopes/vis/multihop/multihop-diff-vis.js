/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Visualize results of patching as an explorable grid.
 */

import {SwipeOverlay} from './swipe-overlay.js';

/**
 * CSS class to assign to container for styling.
 */
const MULTIHOP_VIS_CLASS = 'multihop-vis';
const ACCURACY_FILE =
  'https://storage.googleapis.com/uncertainty-over-space/explorables/patching/multihop/grid_data.json';
const ACCURACY_GRID_SIZE = 40;
const GRID_WIDTH = 500; //px
const HEATMAP_MARGINS = {top: 30, right: 10, bottom: 35, left: 45};
const ENTITY_MARGINS = {top: 5, right: 5, bottom: 20, left: 5};
const GRID_CELL_SIZE =
  (GRID_WIDTH - HEATMAP_MARGINS.top - HEATMAP_MARGINS.bottom) /
  ACCURACY_GRID_SIZE;
const BODY_MARGIN_TOP = 5;
const WINDOW_SCROLL = 3 / 4;
const SCROLL_VISIBLE_HEIGHT = 200;
const WINDOW_SCROLL_THRESHOLD = 100;

/**
 * Multiplier to use for differences in touch clientY position. Higher values
 * will make the story progress faster. A value of 1.0 means 1:1 ratio of scroll
 * speed to pixels dragged.
 */
const TOUCH_DELTA_MULTIPLE = 1.5;

const EXAMPLE_INFO = {
  3: {
    'source': "Pizza's",
    'correct_country': ['Italy'],
    'correct_city': 'Rome',
    'incorrect': 'Nap les',
  },
};

/**
 * Grid visualization.
 *
 */
class MultihopDiffVis {
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

    this.accuracyData = undefined;

    this.currentPrompt = undefined;

    this.annotationSel = undefined;

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

    this.selectedExperiment = undefined;

    this.tableSel = undefined;

    this.currentExperiment = undefined;
    this.previousHeight = undefined;

    /**
     * If the user has initiated a single touch inside the visualization, this
     * will be the `identifier` of the `Touch`.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Touch
     * @type {number|undefined}
     */
    this.activeTouchId = undefined;

    /**
     * When there is an active touch, this will be the last processed `clientY`
     * of that `Touch`. Differences in this value are used to compute how much
     * to adjust tooltips, like `wheelDelta` in the desktop version.
     * @type {number|undefined}
     */
    this.lastTouchY = undefined;
  }

  /**
   * Perform initialization specific to config.
   *
   * @param {Element} containerElem Container element into which to render.
   * @throws {Error} If called more than once.
   * @throws {Error} If unable to download accuracy file.
   */
  async init(containerElem) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }
    this.containerElem = containerElem;

    // Set initially selected source and target layers.

    this.experimentIndex = Object.keys(EXAMPLE_INFO)[0];

    // Set a CSS class on the container for styling.
    containerElem.classList.add(MULTIHOP_VIS_CLASS);

    await this.fetcher
      .fetch(ACCURACY_FILE)
      .then((response) => response.text())
      .then((stringData) => void this.setupAccuracyData(stringData));

    // Once data is loaded and initialized, set up the visual elements.
    this.setupVis();

    // Add the swipe overlay.
    const swipeOverlay = new SwipeOverlay();
    swipeOverlay.init(this.containerElem);
  }

  setupAccuracyData(stringData) {
    this.accuracyData = JSON.parse(stringData);
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
    this.addScrollListeners();
    this.renderAnnotations();
    this.renderAccuracyGrid();
  }

  updateScroll() {
    const rect = this.annotationSel.node().getBoundingClientRect();
    const currentHeight = rect.top + rect.height;
    const triggerWindowScroll = window.screen.height * WINDOW_SCROLL;
    const currentScroll = window.scrollY;
    if (this.previousHeight == undefined) {
      this.previousHeight = currentHeight;
    }
    const changeToFixed =
      (currentHeight > triggerWindowScroll &&
        this.previousHeight < triggerWindowScroll) ||
      (currentHeight < triggerWindowScroll &&
        this.previousHeight > triggerWindowScroll);

    if (
      changeToFixed &&
      !this.fixedScroll &&
      currentScroll > WINDOW_SCROLL_THRESHOLD
    ) {
      this.windowScroll = currentScroll;
      this.fixedScroll = true;

      const {height, left, top} = document.body.getBoundingClientRect();

      // NOTE: We're about to take the body element out of the document flow for
      // the duration of the scrollytelling by setting it's position to fixed.
      // This would give the document an implied height of zero until the body
      // is reinserted AND the browser performs a reflow. Setting a minimum
      // height ensures that later, when we exit the scrollytelling and attempt
      // to scroll the window, it'll be tall enough to accomodate.  Without
      // this, some browsers (Safari) may fail to scroll, causing the page to
      // appear to jump back to the top.
      d3.select('html').style('min-height', `${height}px`);

      // Take the body out of the document flow until scrollytelling is done.
      d3.select('body')
        .style('position', 'fixed')
        .style('left', `${left}px`)
        .style('top', `${top - BODY_MARGIN_TOP}px`);
    }
    this.previousHeight = currentHeight;
  }

  /**
   * Find and return the active `Touch` event among a touch event's list of
   * `changedTouches`.
   * @param {TouchEvent} touchEvent Event in which to find the active touch.
   * @returns {Touch|undefined} Either the active touch, or undefined.
   */
  getActiveTouch(touchEvent) {
    // There can be no active touch if there's no captured identifier.
    if (typeof this.activeTouchId !== 'number') {
      return undefined;
    }

    for (let i = 0; i < touchEvent.changedTouches.length; i++) {
      const touch = touchEvent.changedTouches.item(i);
      if (touch.identifier === this.activeTouchId) {
        return touch;
      }
    }

    return undefined;
  }

  /**
   * Add listeners to the window and content element to implement
   * scrollytelling.
   */
  addScrollListeners() {
    // Listen for `wheel` events, no matter the target.
    window.addEventListener('wheel', (event) => {
      this.updateScroll();
      if (this.fixedScroll) {
        const dir = event.wheelDelta * -0.5;
        this.update(dir);
      }
    });

    // NOTE: Only listening for touchstart events within the visualization.
    this.containerElem.addEventListener('touchstart', (event) => {
      // Ignore `touchstart` events if already touching.
      if (typeof this.activeTouchId === 'number') {
        return;
      }

      // Ignore multi-touch events (such as pinch zoom).
      if (event.changedTouches.length !== 1) {
        return;
      }

      // Stop the browser from scrolling the page, which would be the default
      // behavior for subsequent dragging.
      event.preventDefault();

      // Record the active touch id, for later determining the active touch
      // among changed touches.
      const activeTouch = event.changedTouches[0];
      this.activeTouchId = activeTouch.identifier;
      this.lastTouchY = activeTouch.clientY;
    });

    // While the `touchstart` listener is on the vis container element, the
    // `touchend` and `touchmove` events need to be at a higher level since the
    // user will drag their finger outside the bounding box of the vis.
    window.addEventListener('touchend', (event) => {
      const activeTouch = this.getActiveTouch(event);
      if (activeTouch) {
        this.activeTouchId = undefined;
        this.lastTouchY = undefined;
      }
    });

    // At the `window` scope, listen for `touchmove` events, and if there's an
    // active touch, use the Y difference to advance the story.
    window.addEventListener('touchmove', (event) => {
      const activeTouch = this.getActiveTouch(event);
      if (!activeTouch) {
        return;
      }

      const touchDelta = this.lastTouchY - activeTouch.clientY;
      this.lastTouchY = activeTouch.clientY;

      this.update(touchDelta * TOUCH_DELTA_MULTIPLE);
    });
  }

  renderAnnotations() {
    this.annotationSel = d3
      .select(this.containerElem)
      .append('div')
      .attr('class', 'multihop-annotation-container-diff');

    const step1Text =
      '<strong>Step 1</strong>: To start, we compute a heatmap across all of ' +
      'the multi-hop examples above, in which lighter colors reflect no change ' +
      'in accuracy between the baseline and patched generations, while darker ' +
      'colors reflect a significant increase in accuracy in the patched ' +
      'generations compared to the baseline. This highlights a small epicenter ' +
      'of early-middle source layer and early target layer pairs that yield ' +
      'a corrected result when patched. <br><br>It also exposes regions where ' +
      'patching doesn’t seem to work as well. Let’s explore these regions.';
    this.annotationSel
      .append('div')
      .attr('class', 'tooltip-multihop info wide basic step1')
      .append('span')
      .html(step1Text);

    const step2Text =
      '<strong>Step 2</strong>: Poking around the ' +
      '<span class="source-highlighted">lower-left</span> corner of the ' +
      'grid reveals ambiguous continuations. <br><br>For example, using the ' +
      'multi-hop query "the largest city in Pizza\'s country of origin", ' +
      'patching from source layer 6 to target layer 4 outputs "is the ' +
      'capital city of the country." <br><br>This aligns with what we ' +
      'encountered in the case studies above: in the very early source layers, ' +
      'the model has not yet established context in its hidden representation.';
    this.annotationSel
      .append('div')
      .attr('class', 'tooltip-multihop info wide entity step2')
      .append('span')
      .html(step2Text);

    const step3Text =
      '<strong>Step 3</strong>: Looking in the ' +
      '<span class="underline-baseline">upper right</span> corner of the ' +
      'grid, we find that the target model tends to generate continuation ' +
      'templates, such as "is {}.The capital of {} is". <br><br>Some ' +
      'minor variation of this template string is generated for the ' +
      '"largest city" queries when you patch from source layer 17 or later ' +
      'to target layer 25 or later. <br><br>The stability of generations ' +
      'in this region is interesting; it suggests the model understands ' +
      'that it needs to produce something in that form, but cannot extract ' +
      'it from the context. This aligns with the notion that later layers ' +
      'are primarily aligned toward decoding information into the correct ' +
      'form. <br><br>In contrast, patching generations from earlier ' +
      'source layers (16 or less) into these same later target layers are ' +
      'considerably less stable, ranging from seemingly unrelated, ' +
      'partially completed code snippets in Markdown (e.g., ' +
      '"&lt;s&gt; # ```def get_larg") to semantically related but ' +
      'syntactically incorrect formulations (e.g., ", the capital of the ' +
      'state of, is."). This may suggest that the model is having trouble ' +
      'processing very early context representations into decoded token ' +
      'predictions.';
    this.annotationSel
      .append('div')
      .attr('class', 'tooltip-multihop info wide baseline step3')
      .append('span')
      .html(step3Text);

    const step4Text =
      '<strong>Step 4</strong>: In the ' +
      '<span class="underline-patching">middle</span> region, behavioral ' +
      'patterns start to get murky. <br><br>Most often, the model is on ' +
      'track but incorrect. Consider the "largest city" examples: there is ' +
      'a large region where the model consistently generates Tokyo as the ' +
      'response. This is the correct answer for the "Sushi" example, so ' +
      'you can see this region on the heatmap (the lightest purple), but ' +
      'for the rest of the examples it is wrong. Tokyo <em>is</em> the ' +
      'largest city in the world, so one possible explanation is that, for ' +
      'these layer pairs, the model knows that it needs to find the ' +
      'largest city but does not know that it needs to find that city ' +
      'relative to a place-based constraint.<br><br>Similarly for the two ' +
      '"capital of" examples, the model tends to generate Paris for a ' +
      'large region in the grid. This region tends to be middle-to-late ' +
      'source layers (approx. 10-40) and early-to-middle target layers ' +
      '(approx. 8-16). The model seems to know what type of information is ' +
      'required, but has difficulty incorporating the place-based ' +
      'constraint into its reasoning process, and falls back to a frequently ' +
      'occurring capital city.';
    this.annotationSel
      .append('div')
      .attr('class', 'tooltip-multihop info wide patching step4')
      .append('span')
      .html(step4Text);
  }

  renderAccuracyGrid() {
    const tableDiff = d3
      .select(this.containerElem)
      .append('div')
      .classed('table-diff-container', true);
    tableDiff.append('div').classed('section-title grid', true);
    this.tableSel = tableDiff.append('div').classed('table-diff', true);
    this.renderGrid();
  }

  renderGrid() {
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
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 0 - HEATMAP_MARGINS.top / 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--pair-gray-800)')
      .text('Multi-Hop Patching Average Accuracy')
      .style('font-weight', 'bold');

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
      .data(this.accuracyData)
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
      .style('fill', (d) => this.getAllGridFillColor(d));

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

    const path1 = d3.path();
    path1.moveTo(0, (height * 3) / 4);
    path1.quadraticCurveTo(width / 4, (height * 3) / 4, width / 4, height);
    path1.quadraticCurveTo(width / 4, (height * 3) / 4, 0, (height * 3) / 4);
    path1.closePath;
    const step2Path = svg
      .append('path')
      .classed('step-2-path', true)
      .attr('d', path1.toString())
      .attr('stroke', 'var(--pair-neutral-500)')
      .attr('fill', 'none')
      .attr('stroke-width', '3px')
      .style('visibility', 'hidden');
    const path2 = d3.path();
    path2.moveTo(width / 3, 0);
    path2.quadraticCurveTo(width / 3, height / 2, width, height / 2);
    path2.quadraticCurveTo(width / 3, height / 2, width / 3, 0);
    path2.closePath;
    const step3Path = svg
      .append('path')
      .attr('class', 'step-3-path')
      .attr('d', path2.toString())
      .attr('stroke', 'goldenrod')
      .attr('fill', 'none')
      .attr('stroke-width', '3px')
      .style('visibility', 'hidden');
    const path3 = d3.path();
    path3.moveTo(width / 2, height / 2);
    path3.arc(width * 1.5, (height * 5.5) / 8, width / 2, (height * 7) / 8);
    path3.arc(-width / 2, (height * 5) / 8, width / 2, height / 2);

    path3.closePath;
    const ellipse = svg
      .append('ellipse')
      .attr('class', 'step-4-path')
      .attr('cx', width / 2)
      .attr('cy', (height * 11) / 16)
      .attr('rx', width / 2)
      .attr('ry', height / 5)
      .attr('fill', 'none')
      .attr('stroke-width', '3px')
      .attr('stroke', 'var(--pair-accent-purple-muted-neon')
      .style('visibility', 'hidden');
  }

  /**
   * @param {number} dir Amount no move the annotation node's scrollTop.
   */
  update(dir) {
    this.annotationSel.node().scrollTop += dir;

    const bBox = this.annotationSel.node().getBoundingClientRect();
    const scrollTop = this.annotationSel.node().scrollTop;
    const scrollHeight = this.annotationSel.node().scrollHeight - bBox.height;
    const diff = Math.abs(scrollTop - scrollHeight);
    const eps = 1;

    if (this.fixedScroll && (diff < eps || scrollTop <= 0)) {
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('left');
      document.body.style.removeProperty('top');
      window.scroll(0, this.windowScroll);

      this.fixedScroll = false;
      this.previousHeight = undefined;
    }
    const y = this.annotationSel.node().getBoundingClientRect().y;
    const step1 =
        this.annotationSel.select('.step1').node().getBoundingClientRect().y -
        y,
      step2 =
        this.annotationSel.select('.step2').node().getBoundingClientRect().y -
        y,
      step3 =
        this.annotationSel.select('.step3').node().getBoundingClientRect().y -
        y,
      step4 =
        this.annotationSel.select('.step4').node().getBoundingClientRect().y -
        y;

    const box1 = d3.selectAll('.step-1-path'),
      box2 = d3.selectAll('.step-2-path'),
      box3 = d3.selectAll('.step-3-path'),
      box4 = d3.selectAll('.step-4-path');
    box1.style('visibility', () =>
      step1 < SCROLL_VISIBLE_HEIGHT ? 'visible' : 'hidden',
    );
    box2.style('visibility', () =>
      step2 < SCROLL_VISIBLE_HEIGHT ? 'visible' : 'hidden',
    );
    box3.style('visibility', () =>
      step3 < SCROLL_VISIBLE_HEIGHT ? 'visible' : 'hidden',
    );
    box4.style('visibility', () =>
      step4 < SCROLL_VISIBLE_HEIGHT ? 'visible' : 'hidden',
    );
  }

  getAllGridFillColor(d) {
    const mapValToOpacity = {0: 0, 0.2: 0.2, 0.4: 0.5, 0.6: 0.9, 0.8: 1};
    const r = 103;
    const g = 24;
    const b = 175;
    const a = mapValToOpacity[d.accuracy];
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
export function multihopDiffVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `MultihopVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new MultihopDiffVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
