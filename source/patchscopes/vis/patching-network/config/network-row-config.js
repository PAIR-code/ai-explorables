/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Configuration for a network row.
 */

/**
 * Configuration for a network row. Unlike network columns, network rows do not
 * need padding since ingress and egress points for arrows are always on the
 * center line of the row.
 */
export class NetworkRowConfig {
  constructor() {
    /**
     * Height of the network row in pixels.
     * @type {number}
     */
    this.height = 0;

    /**
     * Margin below the row in pixels.
     * @type {number}
     */
    this.marginBottom = 0;

    /**
     * Margin above the row in pixels.
     * @type {number}
     */
    this.marginTop = 0;

    /**
     * Next row's network row config, if any.
     * @type {NetworkRowConfig}
     */
    this.nextNetworkRowConfig = undefined;

    /**
     * Input token position index for this row. If undefined, then
     * `positionIndexRange` will be specified instead.
     * @type {number|undefined}
     */
    this.positionIndex = undefined;

    /**
     * Input token position index range for this row. If undefined, then
     * `positionIndex` will be specified instead.
     * @type {number[]|undefined}
     */
    this.positionIndexRange = undefined;

    /**
     * Folded rows represented by this row config. If undefined, then
     * `positionIndex` will be specified instead.
     * @type {object[]|undefined}
     */
    this.foldedRows = undefined;

    /**
     * Previous row's network row config, if any.
     * @type {NetworkRowConfig}
     */
    this.previousNetworkRowConfig = undefined;

    /**
     * Index of the row.
     * @type {number}
     */
    this.rowIndex = 0;

    /**
     * Top edge of row in pixels.
     * @type {number}
     */
    this.top = 0;
  }

  /**
   * @returns An object with the same numeric values.
   */
  clone() {
    const cloneConfig = new (Object.getPrototypeOf(this).constructor)();
    cloneConfig.height = this.height;
    cloneConfig.marginBottom = this.marginBottom;
    cloneConfig.marginTop = this.marginTop;
    cloneConfig.top = this.top;
    return cloneConfig;
  }

  /**
   * @returns Height of the row including content height proper and margin.
   */
  getTotalHeight() {
    return this.marginTop + this.height + this.marginBottom;
  }

  /**
   * @returns Offset Y coordinate from the top edge of the total column.
   */
  getCenterOffsetY() {
    return this.marginTop + this.height * 0.5;
  }

  /**
   * @returns Y coordinate of the center of the row.
   */
  getCenterY() {
    return this.top + this.getCenterOffsetY();
  }
}
