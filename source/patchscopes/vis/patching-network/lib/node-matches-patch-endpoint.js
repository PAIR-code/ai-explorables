/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Utility function to test if a node matches a patch endpoint.
 */

import {HiddenStateVectorColumnConfig} from '../config/hidden-state-vector-column-config.js';
import {LayerColumnConfig} from '../config/layer-column-config.js';
import {SkippedLayersColumnConfig} from '../config/skipped-layers-column-config.js';

/**
 * Check wether a given patching network node matches the patch endpoint.
 * @param {PatchingNetworkNode} patchingNetworkNode Node to check.
 * @param {object} patchEndpoint Endpoint to check.
 * @param {number} patchEndpoint.networkIndex
 * @param {number} patchEndpoint.positionIndex
 * @param {number} patchEndpoint.layerIndex
 * @returns {boolean} Whether the node matches the endpoint.
 */
export function nodeMatchesPatchEndpoint(patchingNetworkNode, patchEndpoint) {
  if (!(patchingNetworkNode.columnConfig instanceof LayerColumnConfig)) {
    // Only layer nodes (hidden state vectors or skipped layers) can possibly be
    // involved in a patch.
    return false;
  }

  // Check for network index match.
  if (patchEndpoint.networkIndex !== patchingNetworkNode.networkIndex) {
    return false;
  }

  const {columnConfig} = patchingNetworkNode;

  if (
    patchingNetworkNode.columnConfig instanceof HiddenStateVectorColumnConfig &&
    patchEndpoint.layerIndex !== columnConfig.layerIndex
  ) {
    // Layer indices don't match.
    return false;
  }

  if (
    patchingNetworkNode.columnConfig instanceof SkippedLayersColumnConfig &&
    (patchEndpoint.layerIndex < columnConfig.startLayerIndex ||
      patchEndpoint.layerIndex > columnConfig.endLayerIndex)
  ) {
    // Skipped layer index range does not include patch endpoint.
    return false;
  }

  const {
    rowConfig: {positionIndex, positionIndexRange},
  } = patchingNetworkNode;

  // Sanity check.
  if (positionIndex === undefined && positionIndexRange === undefined) {
    throw new Error('row config lacks position index to check');
  }

  // Check for row index inclusion.
  if (
    positionIndex !== undefined &&
    positionIndex !== patchEndpoint.positionIndex
  ) {
    // Node's row's token position index doesn't match patch endpoint.
    return false;
  }

  if (
    positionIndexRange !== undefined &&
    (patchEndpoint.positionIndex < positionIndexRange[0] ||
      patchEndpoint.positionIndex > positionIndexRange[1])
  ) {
    // Node's row's position index range does not include the patch endpoint.
    return false;
  }

  // All criteria passed.
  return true;
}
