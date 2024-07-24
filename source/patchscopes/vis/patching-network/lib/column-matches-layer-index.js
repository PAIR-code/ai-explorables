/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Test whether a column config matches a layer index.
 */

import {HiddenStateVectorColumnConfig} from '../config/hidden-state-vector-column-config.js';
import {NetworkColumnConfig} from '../config/network-column-config.js';
import {SkippedLayersColumnConfig} from '../config/skipped-layers-column-config.js';

/**
 * @param {NetworkColumnConfig} columnConfig
 * @param {number} layerIndex
 * @returns {boolean} Whether layer index is represented by column config.
 */
export function columnMatchesLayerIndex(columnConfig, layerIndex) {
  if (columnConfig instanceof HiddenStateVectorColumnConfig) {
    return columnConfig.layerIndex === layerIndex;
  }
  if (columnConfig instanceof SkippedLayersColumnConfig) {
    return (
      columnConfig.startLayerIndex <= layerIndex &&
      layerIndex <= columnConfig.endLayerIndex
    );
  }
  return false;
}
