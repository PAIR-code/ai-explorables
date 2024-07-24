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
const TRUNCATE_INDEX = 10;
const ENTITY_TRUNCATE_INDEX = 10;
const WINDOW_SCROLL = 3 / 4;

const BODY_MARGIN_TOP = 5;
const SCROLL_VISIBLE_HEIGHT = 350;
const INIT_POSITIONS = [0, 400, 650, 800, 1000];
const POSITION_TO_VISUALIZE = [10, 250, 300, 350, 450];
const PER_TOOLTIP_HEIGHT = 100;
const MAX_SINGLE_SCROLL = 70;
const WINDOW_SCROLL_THRESHOLD = 100;

/**
 * Multiplier to use for differences in touch clientY position. Higher values
 * will make the story progress faster. A value of 1.0 means 1:1 ratio of scroll
 * speed to pixels dragged.
 */
const TOUCH_DELTA_MULTIPLE = 1.5;

const EXAMPLE_INFO = {
  'source': "Pizza's",
  'correct_country': 'Italy',
  'correct_city': 'Rome',
  'incorrect': 'Nap les',
  'correct_entity_idxs': [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
  ],
};

/**
 * Grid visualization.
 *
 */
class MultihopSingleVis {
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

    this.currentPrompt = undefined;

    this.experimentIndex = undefined;

    this.patchedTokens = undefined;

    this.annotationSel = undefined;

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
   */
  async init(containerElem) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }
    this.containerElem = containerElem;
    this.fixedScroll = false;
    this.windowScroll = 0;

    // Set a CSS class on the container for styling.
    containerElem.classList.add(MULTIHOP_VIS_CLASS);
    this.setupData();

    // Once data is loaded and initialized, set up the visual elements.
    this.setupVis();

    // Add the swipe overlay.
    const swipeOverlay = new SwipeOverlay();
    swipeOverlay.init(this.containerElem);
  }

  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  setupData() {
    this.currentPrompt = "The largest city in Pizza's country of origin";

    this.patchedTokens = this.processTokens(
      'is Rome , which is the capital of Italy .',
    );

    this.entityTokens = [
      'Italy',
      ':',
      'Country',
      'in',
      'Southern',
      'Europe',
      ',',
      '',
    ]
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
    this.renderAnnotations();
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
        this.updatePositions(
          this.annotationSel.selectAll('.tooltip-multihop'),
          dir,
        );
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

      this.updatePositions(
        this.annotationSel.selectAll('.tooltip-multihop'),
        touchDelta * TOUCH_DELTA_MULTIPLE,
      );
    });
  }

  addTooltip(step, text, labelClass, outputLabel) {
    const tooltip = this.annotationSel
      .append('div')
      .attr(
        'class',
        `tooltip-multihop single info wide step${step} ${labelClass ?? ''}`,
      )
      .style('top', `${INIT_POSITIONS[step - 1]}px`);
    const tooltipHeader = tooltip.append('div');
    tooltipHeader
      .append('div')
      .attr('class', 'label small')
      .text(`Step ${step}`);
    tooltipHeader.append('div').append('span').html(text);
    const tooltipContent = tooltip
      .append('div')
      .attr('class', `line output multihop-intro ${labelClass ?? ''}`)
      .classed(`step-${step}-output`, true);
    tooltipContent
      .append('div')
      .attr('class', 'label small')
      .text(`Step ${step}`);
    tooltipContent.append('div').attr('class', 'label').text(outputLabel);
    return tooltipContent;
  }

  renderAnnotations() {
    this.addScrollListeners();

    const hop2Prompt = "Pizza's country of origin";
    const hop2Generation = 'is Italy . In g red ients \n';
    const hop3Prompt = 'The largest city in Italy';
    const hop3Generation =
      'and the capital of the Laz io region , Rome is a city rich in history , culture , and';
    const multihopGeneration = ', Nap les , is also known for its p izza . ';

    this.annotationSel = d3
      .select(this.containerElem)
      .append('div')
      .attr('class', 'multihop-annotation-container');

    const step1Text =
      'The multi-hop query is composed of two factual queries, both of which the model is able to independently answer correctly.';
    const step1QuerySection = this.addTooltip(
      1,
      step1Text,
      'basic',
      hop2Prompt,
    );

    const tokens1 = step1QuerySection
      .append('p')
      .classed('token-container', true);

    this.initTokens(
      tokens1,
      this.processTokens(hop2Generation),
      EXAMPLE_INFO['correct_country'],
      true,
    );

    step1QuerySection
      .append('div')
      .attr('class', 'label')
      .style('padding-top', '8px')
      .text(hop3Prompt);

    const tokens2 = step1QuerySection
      .append('p')
      .classed('token-container', true);

    this.initTokens(
      tokens2,
      this.processTokens(hop3Generation),
      EXAMPLE_INFO['correct_city'],
      true,
    );

    const baselineText =
      'Without intervention, the model returns an incorrect answer to the multi-hop query.';
    const baselineSection = this.addTooltip(
      2,
      baselineText,
      'baseline',
      "Baseline: The largest city in Pizza's country of origin",
    );

    const baseline = baselineSection
      .append('span')
      .attr('class', 'token-container baseline');
    this.initTokens(
      baseline,
      this.processTokens(multihopGeneration),
      EXAMPLE_INFO['incorrect'],
      false,
    );

    const sourceText = `Using the same source and inspection prompt, we can patch from the <span class="source-highlighted">origin</span> token to the <span class="target-highlighted">Pizza's</span> token, splicing the model’s own intermediate answer to make it easier to deduce the final answer.`;
    const sourcePrompt = this.addTooltip(
      3,
      sourceText,
      'basic source-prompt',
      'Multi-Hop Query',
    );
    sourcePrompt
      .append('span')
      .classed('start', true)
      .text('The largest city in ');
    sourcePrompt
      .append('span')
      .classed('target-highlighted', true)
      .classed('food', true)
      .text(EXAMPLE_INFO['source']);
    sourcePrompt.append('span').classed('end', true).text(' country of ');

    sourcePrompt
      .append('span')
      .classed('source-highlighted', true)
      .text('origin');

    const entityText =
      'If we choose a suitable source layer, we can use entity description as a checkpoint to find the correct intermediate answer to patch.';
    const entitySection = this.addTooltip(
      4,
      entityText,
      'entity',
      'Entity Description at source layer 16',
    );

    const entity = entitySection
      .append('span')
      .attr('class', 'token-container entity');

    this.initTokens(
      entity,
      this.entityTokens,
      EXAMPLE_INFO['correct_country'],
      true,
    );

    const patchingText =
      "With suitable source and target layer choices, we can successfully correct the model's response.";
    const patchingSection = this.addTooltip(
      5,
      patchingText,
      'patching',
      'Patching from source layer 16 to target layer 7',
    );

    const patched = patchingSection
      .append('span')
      .classed('token-container', true);

    this.initTokens(
      patched,
      this.patchedTokens,
      EXAMPLE_INFO['correct_city'],
      true,
    );
  }

  updatePositions(tooltips, dir) {
    for (const tooltip of tooltips.nodes().reverse()) {
      const idx = tooltips.nodes().indexOf(tooltip);
      const previousTop = Number(tooltip.style['top'].slice(0, -2));

      if (dir > 0) {
        tooltip.style['top'] = `${Math.max(previousTop - dir, 0)}px`;
      } else {
        if (idx == 4) {
          tooltip.style['top'] =
            `${Math.min(previousTop - dir, INIT_POSITIONS[idx])}px`;
        } else {
          const nextTooltipTop = tooltips
            .nodes()
            [idx + 1].style['top'].slice(0, -2);
          if (
            nextTooltipTop >=
            SCROLL_VISIBLE_HEIGHT - PER_TOOLTIP_HEIGHT * idx
          ) {
            tooltip.style['top'] =
              `${Math.min(previousTop - dir, INIT_POSITIONS[idx])}px`;
          }
        }
      }
    }
    this.update();
  }

  update() {
    const tooltips = this.annotationSel.selectAll('.tooltip-multihop').nodes();
    const scrollTop = tooltips.every(
      (tooltip) => tooltip.style['top'].slice(0, -2) == 0,
    );
    const scrollBottom = tooltips.every(
      (tooltip) =>
        tooltip.style['top'].slice(0, -2) ==
        INIT_POSITIONS[tooltips.indexOf(tooltip)],
    );

    if (this.fixedScroll && (scrollTop || scrollBottom)) {
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('left');
      document.body.style.removeProperty('top');
      this.fixedScroll = false;
      this.previousHeight = undefined;
      window.scroll({behavior: 'instant', top: this.windowScroll});
    }

    const y = this.annotationSel.node().getBoundingClientRect().y;
    const visibleList = tooltips.map((tooltip, i) =>
      tooltip.getBoundingClientRect().y - y < POSITION_TO_VISUALIZE[i] ? i : 0,
    );

    const opaque = Math.max(...visibleList);

    this.annotationSel
      .selectAll('.tooltip-multihop')
      .style('opacity', (d, i) => (opaque == i ? '100%' : '50%'));
  }

  initTokens(sel, tokens, answer = undefined, isCorrect = true) {
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
          (answer?.split(' ').includes(d.id) ? correctnessClass : ''),
      )
      .text(({id}) => id);
  }
}

/**
 * Factory function that returns a callback to register vis.  The returned
 * callback function will construct and initialize a `MultihopSingleVis`.
 * @see MultihopVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's a
 * `MultihopSingleVis`.
 */
export function multihopSingleVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `MultihopVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new MultihopSingleVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
