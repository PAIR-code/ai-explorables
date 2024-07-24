/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Configuration for a transformer/patching network column.
 */

/**
 * Configuration for a network column. Like a DOM element using content-box
 * sizing, a column has a width, padding and margin. The ingress and egress
 * points for path arrows are computed to be at the boundary between the padding
 * and margin.
 */
export class NetworkColumnConfig {
  constructor() {
    /**
     * Index of the column.
     * @type {number}
     */
    this.columnIndex = 0;

    /**
     * Left edge of column in pixels.
     * @type {number}
     */
    this.left = 0;

    /**
     * Margin to the left of the column in pixels.
     * @type {number}
     */
    this.marginLeft = 0;

    /**
     * Margin to the right of the column in pixels.
     * @type {number}
     */
    this.marginRight = 0;

    /**
     * Next column's network column config, if any.
     * @type {NetworkColumnConfig}
     */
    this.nextNetworkColumnConfig = undefined;

    /**
     * Padding to the left of the column in pixels.
     * @type {number}
     */
    this.paddingLeft = 0;

    /**
     * Padding to the right of the column in pixels.
     * @type {number}
     */
    this.paddingRight = 0;

    /**
     * Previous column's network column config, if any.
     * @type {NetworkColumnConfig}
     */
    this.previousNetworkColumnConfig = undefined;

    /**
     * Width of the network column in pixels.
     * @type {number}
     */
    this.width = 0;
  }

  /**
   * @returns An object with the same numeric values.
   */
  clone() {
    const cloneConfig = new (Object.getPrototypeOf(this).constructor)();
    cloneConfig.columnIndex = this.columnIndex;
    cloneConfig.left = this.left;
    cloneConfig.marginLeft = this.marginLeft;
    cloneConfig.marginRight = this.marginRight;
    cloneConfig.paddingLeft = this.paddingLeft;
    cloneConfig.paddingRight = this.paddingRight;
    cloneConfig.width = this.width;
    return cloneConfig;
  }

  /**
   * @returns Width of the column content proper plus padding.
   */
  getContentWidth() {
    return this.paddingLeft + this.width + this.paddingRight;
  }

  /**
   * @returns Width of the whole column, including both padding and margin.
   */
  getTotalWidth() {
    return this.marginLeft + this.getContentWidth() + this.marginRight;
  }

  /**
   * @returns Offset X coordinate from the left-hand edge of the total column.
   */
  getCenterOffsetX() {
    return this.marginLeft + this.paddingLeft + this.width * 0.5;
  }

  /**
   * @returns X coordinate of the center of the column.
   */
  getCenterX() {
    return this.left + this.getCenterOffsetX();
  }
}
