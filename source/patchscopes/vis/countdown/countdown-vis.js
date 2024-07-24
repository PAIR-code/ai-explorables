/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Example visualization to use as a template.
 */

/**
 * Default precision to display on timer.
 */
const DEFAULT_PRECISION = 3;

/**
 * CSS class to assign to container for styling.
 */
const VIS_CLASS = 'countdown-vis';

/**
 * Countdown timer visualization for demonstration purposes.
 *
 * Clicking the timer will start, stop or reset it depending on the state.
 *
 * @property {Element} containerElem Container element into which to render.
 * @property {Element} counterElem Element showing the count.
 * @property {number} frameHandle Handle from `requestAnimationFrame()`.
 * @property {boolean} isRunning Whether the counter is running.
 * @property {number} lastTimestamp Last animation frame callback invocation ts.
 * @property {number} precision Number of decimal places to show on timer.
 * @property {number} seconds Number of seconds to count down from config.
 * @property {number} timeRemainingMs Remaining time in milliseconds.
 */
class CountdownVis {
  /**
   * Setup internal state members.
   */
  constructor() {
    this.isRunning = false;
  }

  /**
   * Perform initialization specific to config.
   *
   * Example configuration JSON:
   *
   * ```
   * {
   *   "type": "countdown",
   *   "seconds": 30,
   *   "precision": 3
   * }
   * ```
   *
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @param {number} configJson.seconds Number of seconds to count down.
   * @param {number} configJson.precision Optional precision for formatting.
   * @throws {Error} If called more than once.
   * @throws {RangeError} If `seconds` is not a finite non-negative number.
   * @throws {RangeError} If `precision` is not a non-negative integer.
   */
  async init(containerElem, configJson) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }
    this.containerElem = containerElem;

    // Check the config for required fields.
    const seconds = +configJson.seconds;
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      throw new RangeError('seconds must be a finite, non-negative number');
    }
    this.seconds = seconds;

    // Check the config for optional fields.
    let precision = DEFAULT_PRECISION;
    if ('precision' in configJson) {
      const configPrecision = +configJson.precision;
      if (!Number.isInteger(configPrecision) || configPrecision < 0) {
        throw new RangeError('precision must be a non-negative integer');
      }
      precision = configPrecision;
    }
    this.precision = precision;

    // Set a CSS class on the container for styling.
    containerElem.classList.add(VIS_CLASS);

    // Create an element to show the count.
    const {ownerDocument} = containerElem;
    this.counterElem = ownerDocument.createElement('span');
    containerElem.appendChild(this.counterElem);

    // Loading...
    await this.loadProgress();

    // Register click handler on container.
    containerElem.addEventListener('click', () => void this.handleClick());

    // Perform frame rendering.
    this.onFrame();
  }

  /**
   * For dramatic effect, to demonstrate a slow-to-start visualization, begin
   * by showing a loading message for three seconds, with progress dots.
   */
  async loadProgress() {
    let loadingRenderHandle = undefined;

    const loadingRenderFn = () => {
      // Since the content is centered, padding with non-breaking spaces
      // prevents too much jitter.
      const dotsAndNbsp = '.'
        .repeat(Math.round(Date.now() / 400) % 4)
        .padEnd(4, '\u00a0');
      this.counterElem.textContent = `Loading${dotsAndNbsp}`;
      loadingRenderHandle = requestAnimationFrame(loadingRenderFn);
    };

    loadingRenderFn();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    cancelAnimationFrame(loadingRenderHandle);
  }

  /**
   * Handle clicks on the container element.
   */
  handleClick() {
    this.lastTimestamp = Date.now();

    if (this.timeRemainingMs <= 0) {
      // Reset when finished.
      this.isRunning = false;
      this.timeRemainingMs = this.seconds * 1000;
    } else {
      // Otherwise, toggle running state.
      this.isRunning = !this.isRunning;
    }

    // Perform frame rendering.
    this.onFrame();
  }

  /**
   * Perform animation frame rendering. May schedule another frame.
   */
  onFrame() {
    this.cancelFrame();

    // Initialize remaining time if needed.
    if (this.timeRemainingMs === undefined) {
      this.timeRemainingMs = this.seconds * 1000;
    }

    // Update time remaining if running.
    if (this.isRunning) {
      const now = Date.now();
      const timeRemainingMs = this.timeRemainingMs + this.lastTimestamp - now;
      this.timeRemainingMs = Math.max(0, timeRemainingMs);
      this.lastTimestamp = now;
      if (this.timeRemainingMs <= 0) {
        this.isRunning = false;
      }
    }

    // Display current time.
    this.counterElem.textContent = `${(this.timeRemainingMs * 0.001).toFixed(
      this.precision,
    )}s`;

    // Assign attributes to container element for styling.
    this.containerElem.setAttribute(
      'data-counter-state',
      this.isRunning
        ? 'running'
        : this.timeRemainingMs > 0
          ? 'paused'
          : 'finished',
    );

    // Schedule another frame render if running.
    if (this.isRunning) {
      this.frameHandle = requestAnimationFrame(() => void this.onFrame());
    }
  }

  /**
   * If an animation frame has been requested, cancel it.
   */
  cancelFrame() {
    if (this.frameHandle !== undefined) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = undefined;
    }
  }
}

/**
 * Callback function to register. Construct and initialize a `CounterVis`.
 * @see CounterVis.
 * @param {Element} containerElem Container element into which to render.
 * @param {Object} configJson Configuration JSON object.
 */
export async function countdownVis(containerElem, configJson) {
  const vis = new CountdownVis();
  return vis.init(containerElem, configJson);
}
