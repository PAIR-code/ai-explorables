/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Test whether a node matches a layer tag.
 */

import {HiddenStateVectorColumnConfig} from '../config/hidden-state-vector-column-config.js';
import {SkippedLayersColumnConfig} from '../config/skipped-layers-column-config.js';
import {UnembeddingColumnConfig} from '../config/unembedding-column-config.js';
import {NetworkNode} from '../renderables/network-node.js';
import {columnMatchesLayerIndex} from './column-matches-layer-index.js';
import {rowMatchesPositionIndex} from './row-matches-position-index.js';

/**
 * @param {NetworkNode} patchingNetworkNode
 * @param {object} layerTag Object with networkIndex, positionIndex, layerIndex.
 * @returns {boolean} Whether the node matches the specified layer tag.
 */
export function nodeMatchesLayerTag(patchingNetworkNode, layerTag) {
  if (patchingNetworkNode.networkIndex !== layerTag.networkIndex) {
    return false;
  }

  const {columnConfig, rowConfig} = patchingNetworkNode;

  const rowMatches = rowMatchesPositionIndex(rowConfig, layerTag.positionIndex);

  // First, check for regular, exact-match layer tags.
  if (!layerTag.after) {
    return (
      rowMatches && columnMatchesLayerIndex(columnConfig, layerTag.layerIndex)
    );
  }

  // For 'after' layer tags, check for same row, but later column.
  if (rowMatches) {
    if (columnConfig instanceof HiddenStateVectorColumnConfig) {
      return columnConfig.layerIndex > layerTag.layerIndex;
    }
    if (columnConfig instanceof SkippedLayersColumnConfig) {
      return columnConfig.endLayerIndex > layerTag.layerIndex;
    }
    if (columnConfig instanceof UnembeddingColumnConfig) {
      return true;
    }
    return false;
  }

  // For 'after' layer tags, check for later row.
  if (rowConfig.positionIndexRange !== undefined) {
    return rowConfig.positionIndexRange[1] > layerTag.positionIndex;
  }
  return rowConfig.positionIndex > layerTag.positionIndex;
}
