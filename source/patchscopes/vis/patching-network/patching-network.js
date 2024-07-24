/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Transformer patching network.
 */

import {EmbeddingColumnConfig} from './config/embedding-column-config.js';
import {HiddenStateVectorColumnConfig} from './config/hidden-state-vector-column-config.js';
import {InputTokenColumnConfig} from './config/input-token-column-config.js';
import {LayerColumnConfig} from './config/layer-column-config.js';
import {NetworkColumnConfig} from './config/network-column-config.js';
import {NetworkConfig} from './config/network-config.js';
import {NetworkRowConfig} from './config/network-row-config.js';
import {OutputTokenColumnConfig} from './config/output-token-column-config.js';
import {PatchingNetworkConfig} from './config/patching-network-config.js';
import {SkippedLayersColumnConfig} from './config/skipped-layers-column-config.js';
import {UnembeddingColumnConfig} from './config/unembedding-column-config.js';
import {InputTokenNode} from './renderables/input-token-node.js';
import {PositionRangeNode} from './renderables/position-range-node.js';
import {OutputTokenNode} from './renderables/output-token-node.js';
import {UnembeddingNode} from './renderables/unembedding-node.js';
import {EmbeddingNode} from './renderables/embedding-node.js';
import {SkippedLayersNode} from './renderables/skipped-layers-node.js';
import {HiddenStateVectorNode} from './renderables/hidden-state-vector-node.js';
import {Renderable} from './renderables/renderable.js';
import {NetworkNode} from './renderables/network-node.js';
import {nodeMatchesPatchEndpoint} from './lib/node-matches-patch-endpoint.js';
import {PatchConnection} from './renderables/patch-connection.js';
import {LayerLabelNode} from './renderables/layer-label-node.js';
import {findInRanges} from '../../lib/find-in-ranges.js';
import {nodeMatchesLayerTag} from './lib/node-matches-layer-tag.js';
import {ConnectionPart} from './renderables/connection-part.js';
import {IncomingConnectionPart} from './renderables/incoming-connection-part.js';
import {OutgoingConnectionPart} from './renderables/outgoing-connection-part.js';
import {VerticalConnectionPart} from './renderables/vertical-connection-part.js';
import {ReusedTokenNode} from './renderables/reused-token-node.js';

/**
 * A transformer network processes a stream of tokens with the trained objective
 * of predicting the next token. Patching is a technique wherein a hidden state
 * vector is patched from one part of a source network into another part of a
 * target network.
 *
 * This object provides data structures for visualizing the nodes and
 * connections of one or more transformer networks, optionally with patching
 * connections between them.
 */
export class PatchingNetwork {
  /**
   * @param {Element} containerElem Container element into which to render.
   */
  constructor(containerElem) {
    /**
     * Container element into which to render.
     * @type {Element}
     */
    this.containerElem = containerElem;

    /**
     * Number of layers the networks have. Determines how many columns of hidden
     * state vector circles will appear (barring skipped layers).
     * @type {number}
     */
    this.numLayers = 0;

    /**
     * Array of rows of objects, each element of the outer array is a network.
     * The inner arrays contain objecs representing the input and/or output of a
     * given network row.
     *
     * Example showing the token rows of two networks, a source and a target:
     *
     * ```
     * [
     *   [
     *     {inputToken: '<s>', positionIndex: 0},
     *     {inputToken: 'Jur', positionIndex: 1},
     *     {inputToken: 'ass', positionIndex: 2},
     *     {inputToken: 'ic', positionIndex: 3},
     *     {inputToken: 'Park', positionIndex: 4},
     *   ],
     *   [
     *     {inputToken: '<s>', positionIndex: 0},
     *     {inputToken: 'Sy', positionIndex: 1},
     *     {inputToken: 'ria', positionIndex: 2},
     *     {inputToken: ':', positionIndex: 3},
     *     {positionIndexRange: [4, 36]},
     *     {inputToken: 'X', positionIndex: 37},
     *     {positionIndex: 38, outputToken: 'Ge'},
     *     {positionIndex: 39, outputToken: 'un'},
     *     {positionIndex: 40, outputToken: 'he'},
     *     {positionIndex: 41, outputToken: ':'},
     *   ]
     * ]
     * ```
     * @type {object[][]}
     */
    this.networkTokenRows = [];

    /**
     * Template network column config for the input tokens column. Will be
     * cloned to create actual column config when needed.
     * @type {NetworkColumnConfig}
     */
    this.inputTokenColumnConfigTemplate = new InputTokenColumnConfig();

    /**
     * Template network column config for the embedding column. Will be cloned
     * to create actual column config when needed.
     * @type {NetworkColumnConfig}
     */
    this.embeddingColumnConfigTemplate = new EmbeddingColumnConfig();

    /**
     * Template network column config for the hidden state vector columns. Will
     * be cloned to create actual column config when needed.
     * @type {NetworkColumnConfig}
     */
    this.hiddenStateVectorColumnConfigTemplate =
      new HiddenStateVectorColumnConfig();

    /**
     * Template network column config for the columns of skipped layers
     * (represented by ellipses). Will be cloned to create actual column config
     * when needed.
     * @type {NetworkColumnConfig}
     */
    this.skippedLayersColumnConfigTemplate = new SkippedLayersColumnConfig();

    /**
     * Template network column config for the unembedding column. Will be cloned
     * to create actual column config when needed.
     * @type {NetworkColumnConfig}
     */
    this.unembeddingColumnConfigTemplate = new UnembeddingColumnConfig();

    /**
     * Template network column config for the output tokens column. Will be
     * cloned to create actual column config when needed.
     * @type {NetworkColumnConfig}
     */
    this.outputTokenColumnConfigTemplate = new OutputTokenColumnConfig();

    /**
     * Template network row config for token rows. Will be cloned to create
     * actual row configs as needed.
     * @type {NetworkRowConfig}
     */
    this.networkRowConfigTemplate = new NetworkRowConfig();

    /**
     * Template for network configurations, to set uniform margins.
     * @type {NetworkConfig}
     */
    this.networkConfigTemplate = new NetworkConfig();

    /**
     * Patching network config created/recreated on each `update()` to reflect
     * object settings.
     * @type {PatchingNetworkConfig}
     * @see createPatchingNetworkConfig()
     */
    this.patchingNetworkConfig = undefined;

    /**
     * Mapping of renderables (nodes and connections) by key. This will be
     * re-generated on each `update()` and bound by D3 to create/update/delete
     * DOM elements.
     * @type {Map<string,Renderable>}
     */
    this.renderables = new Map();

    /**
     * Mapping of network-row-column index strings to the node at that cell.
     * @type {Map<string,NetworkNode>}
     */
    this.nodeGridMap = new Map();

    /**
     * Whether to show the embedding column.
     * @type {boolean}
     */
    this.showEmbeddingColumn = true;

    /**
     * Whether to show the input token column.
     * @type {boolean}
     */
    this.showInputTokenColumn = true;

    /**
     * Whether to show the input token column.
     * @type {boolean}
     */
    this.showOutputTokenColumn = true;

    /**
     * Whether to show the unembedding column.
     * @type {boolean}
     */
    this.showUnembeddingColumn = true;

    /**
     * Configurable array of layer indices or ranges to skip. Note that this
     * array can contain either single layer indices, or tuples of range
     * boundaries. For example, the skipLayers array `[3, [10, 15]]` would skip
     * layer indices 3, 10, 11, 12, 13, 14 and 15.
     * @type {Array<number|number[]>}
     */
    this.skipLayersConfig = [];

    /**
     * Array of layer groups, used to account for skipped layers.
     * Created/updated by the `setupLayerGroups()` method.
     *
     * A layer group is a struct containing a `layerGroupIndex` and either a
     * `layerIndex` or `skippedLayerIndices` field.  The meanings of these fields
     * are as follows:
     *
     * - `layerGroupIndex` - Same as the index within the `layerGroups` array.
     * - `layerIndex` - Singular layer represented by this group.
     * - `skippedLayerIndices` - Array of skipped layer indices.
     *
     * @see updateLayerGroups()
     * @type {object[]}
     */
    this.layerGroups = undefined;

    /**
     * Set of patching connections between networks.
     *
     * Example patch object:
     *
     * ```
     * {
     *   from: {
     *     networkIndex: 0,
     *     positionIndex: 4,
     *     layerIndex: 1,
     *   },
     *   to: {
     *     networkIndex: 1,
     *     positionIndex: 37,
     *     layerIndex: 1,
     *   },
     * },
     * ```
     * @type {Set<object>}
     */
    this.patchSet = new Set();

    /**
     * Map from the `from` network/position/layer key to the patch object.
     * @type {Map<string,object>}
     */
    this.patchFromIndex = new Map();

    /**
     * Map from the `to` network/position/layer key to the patch object.
     * @type {Map<string,object>}
     */
    this.patchToIndex = new Map();

    /**
     * Array of layer tags. These setup special var states for styling nodes and
     * connections.
     * @type {Array<object>}
     */
    this.layerTags = [];

    /**
     * Array of objects indicating the `networkIndex`, `positionIndex`
     * and `layerIndex` after which to stop adding nodes and connections in that
     * network.
     * @type {object}
     */
    this.stopPoints = [];
  }

  /**
   * @param {object} layerTag Tag for a specific network/position/layer.
   * @param {number} layerTag.networkIndex
   * @param {number} layerTag.positionIndex
   * @param {number} layerTag.layerIndex
   * @param {number} layerTag.tag
   */
  addLayerTag(layerTag) {
    this.layerTags.push(layerTag);
  }

  /**
   * @param {object} stopPoint Point specifying network/position/layer.
   * @param {number} stopPoint.networkIndex
   * @param {number} stopPoint.positionIndex
   * @param {number} stopPoint.layerIndex
   */
  addStopPoint(stopPoint) {
    this.stopPoints.push(stopPoint);
  }

  /**
   * Update internal state of nodes and connections based on settings.
   */
  update() {
    this.setupLayerGroups();
    this.setupPatchingNetworkConfig();
    this.setupRenderables();
  }

  /**
   * Because layers can be skipped, to render we need to group layers into
   * alternating groups of visible and skipped. Called by `update()`.
   * @see update()
   */
  setupLayerGroups() {
    const layerGroups = [];
    let skipLayerGroup = undefined;
    for (let i = 0; i < this.numLayers; i++) {
      if (findInRanges(this.skipLayersConfig, i, this.numLayers)) {
        if (!skipLayerGroup) {
          skipLayerGroup = {
            skippedLayerIndices: [],
            layerGroupIndex: layerGroups.length,
          };
          layerGroups.push(skipLayerGroup);
        }
        skipLayerGroup.skippedLayerIndices.push(i);
      } else {
        skipLayerGroup = undefined;
        layerGroups.push({
          layerIndex: i,
          layerGroupIndex: layerGroups.length,
        });
      }
    }
    this.layerGroups = layerGroups;
  }

  /**
   * Setup the `patchingNetworkConfig` based on column templates, network
   * architecture, and input and output tokens.
   * @see update()
   */
  setupPatchingNetworkConfig() {
    // Use settings to generate a PatchingNetworkConfig. There will always be at
    // least one transformer network, the source. There may be a second network,
    // the target.
    const patchingNetworkConfig = new PatchingNetworkConfig();
    this.patchingNetworkConfig = patchingNetworkConfig;

    for (const rows of this.networkTokenRows) {
      const networkConfig = this.networkConfigTemplate.clone();
      patchingNetworkConfig.appendNetworkConfig(networkConfig);

      if (this.showInputTokenColumn) {
        networkConfig.appendColumnConfig(
          this.inputTokenColumnConfigTemplate.clone(),
        );
      }

      if (this.showEmbeddingColumn) {
        networkConfig.appendColumnConfig(
          this.embeddingColumnConfigTemplate.clone(),
        );
      }

      for (const layerGroup of this.layerGroups) {
        const {layerIndex, skippedLayerIndices} = layerGroup;
        if (skippedLayerIndices !== undefined) {
          const skipLayersColumnConfig =
            this.skippedLayersColumnConfigTemplate.clone();
          skipLayersColumnConfig.startLayerIndex = skippedLayerIndices[0];
          skipLayersColumnConfig.endLayerIndex = skippedLayerIndices[1];
          networkConfig.appendColumnConfig(skipLayersColumnConfig);
        } else if (layerIndex !== undefined) {
          const hiddenStateVectorColumnConfig =
            this.hiddenStateVectorColumnConfigTemplate.clone();
          hiddenStateVectorColumnConfig.layerIndex = layerIndex;
          networkConfig.appendColumnConfig(hiddenStateVectorColumnConfig);
        } else {
          throw new Error('layerGroup lacks index information');
        }
      }

      if (this.showUnembeddingColumn) {
        networkConfig.appendColumnConfig(
          this.unembeddingColumnConfigTemplate.clone(),
        );
      }

      if (this.showOutputTokenColumn) {
        networkConfig.appendColumnConfig(
          this.outputTokenColumnConfigTemplate.clone(),
        );
      }

      for (const row of rows) {
        const networkRowConfig = this.networkRowConfigTemplate.clone();
        networkRowConfig.positionIndex = row.positionIndex;
        networkRowConfig.positionIndexRange = row.positionIndexRange;
        networkRowConfig.foldedRows = row.foldedRows;

        if (!isNaN(row.marginBottom)) {
          networkRowConfig.marginBottom = row.marginBottom;
        }
        if (!isNaN(row.marginTop)) {
          networkRowConfig.marginTop = row.marginTop;
        }

        networkConfig.appendRowConfig(networkRowConfig);
      }
    }
  }

  /**
   * Using the patching network config, set up the `renderables` map.
   */
  setupRenderables() {
    // Clear out any previous renderables (blank slate);
    this.renderables = new Map();
    this.nodeGridMap = new Map();

    this.setupNodes();
    this.setupIntraNetworkConnections();
    this.setupPatchingConnections();
  }

  /**
   * Setup renderables representing connections between nodes. Called by
   * `setupRenderables()`.
   * @see setupRenderables()
   */
  setupNodes() {
    const {
      patchingNetworkConfig: {networkConfigs},
    } = this;

    for (
      let networkIndex = 0;
      networkIndex < networkConfigs.length;
      networkIndex++
    ) {
      const networkConfig = networkConfigs[networkIndex];
      const {rowConfigs, columnConfigs} = networkConfig;

      let hitStop = false;

      for (
        let rowIndex = 0;
        !hitStop && rowIndex < rowConfigs.length;
        rowIndex++
      ) {
        const rowConfig = rowConfigs[rowIndex];

        // Check for stopPoints that lack a layer index.
        for (const stopPoint of this.stopPoints) {
          if (
            stopPoint.layerIndex !== undefined ||
            stopPoint.networkIndex !== networkIndex
          ) {
            continue;
          }

          const rowStartPositionIndex = rowConfig.positionIndexRange
            ? rowConfig.positionIndexRange[0]
            : rowConfig.positionIndex;
          if (stopPoint.positionIndex < rowStartPositionIndex) {
            hitStop = true;
            break;
          }
        }
        if (hitStop) {
          break;
        }

        for (
          let columnIndex = 0;
          !hitStop && columnIndex < columnConfigs.length;
          columnIndex++
        ) {
          const columnConfig = columnConfigs[columnIndex];
          const {inputToken, positionIndex, positionIndexRange} =
            this.networkTokenRows[networkIndex][rowIndex];

          const previousOutputToken =
            rowIndex > 0
              ? this.networkTokenRows[networkIndex][rowIndex - 1].outputToken
              : undefined;

          if (columnConfig instanceof InputTokenColumnConfig) {
            if (positionIndexRange !== undefined) {
              this.addNode(
                new PositionRangeNode({
                  networkIndex,
                  columnConfig,
                  rowConfig,
                  positionIndexRange,
                }),
              );
            } else if (inputToken !== undefined) {
              const node = new InputTokenNode({
                text: inputToken,
                networkIndex,
                columnConfig,
                rowConfig,
                positionIndex,
              });
              node.varStates.push(`network-${networkIndex}`);
              this.addNode(node);
            } else if (previousOutputToken !== undefined) {
              this.addNode(
                new ReusedTokenNode({
                  networkIndex,
                  columnConfig,
                  rowConfig,
                }),
              );
            }
          }

          if (columnConfig instanceof EmbeddingColumnConfig) {
            const node =
              positionIndexRange !== undefined
                ? new PositionRangeNode({
                    networkIndex,
                    columnConfig,
                    rowConfig,
                    positionIndexRange,
                  })
                : new EmbeddingNode({
                    networkIndex,
                    columnConfig,
                    rowConfig,
                  });
            this.addNode(node);

            // Check for layerIndex=-1 matching stops.
            for (const stopPoint of this.stopPoints) {
              if (
                stopPoint.networkIndex === networkIndex &&
                stopPoint.positionIndex === rowConfig.positionIndex &&
                stopPoint.layerIndex === -1
              ) {
                // Short circuit if we've hit a stop point.
                hitStop = true;
                break;
              }
            }
            if (hitStop) {
              break;
            }
          }

          if (columnConfig instanceof HiddenStateVectorColumnConfig) {
            const {layerIndex} = columnConfig;

            if (networkIndex === 0 && rowIndex === 0) {
              // NOTE: Layer label nodes are not attached to the node grid
              // graph, so here we only call `addRenderable()` not `addNode()`.
              this.addRenderable(
                new LayerLabelNode({
                  layerIndex,
                  networkIndex,
                  columnConfig,
                  rowConfig,
                }),
              );
            }

            const node =
              positionIndexRange !== undefined
                ? new PositionRangeNode({
                    networkIndex,
                    columnConfig,
                    rowConfig,
                    positionIndexRange,
                  })
                : new HiddenStateVectorNode({
                    networkIndex,
                    columnConfig,
                    rowConfig,
                    layerIndex,
                  });
            this.addNode(node);

            for (const stopPoint of this.stopPoints) {
              if (nodeMatchesLayerTag(node, stopPoint)) {
                // Short circuit if we've hit a stop point.
                hitStop = true;
                break;
              }
            }
            if (hitStop) {
              break;
            }
          }

          if (columnConfig instanceof SkippedLayersColumnConfig) {
            const {startLayerIndex, endLayerIndex} = columnConfig;

            const node = new SkippedLayersNode({
              networkIndex,
              columnConfig,
              rowConfig,
              startLayerIndex,
              endLayerIndex,
            });
            if (positionIndexRange) {
              node.varStates.push('folded-rows');
            }

            this.addNode(node);

            for (const stopPoint of this.stopPoints) {
              if (nodeMatchesLayerTag(node, stopPoint)) {
                // Short circuit if we've hit a stop point.
                hitStop = true;
                break;
              }
            }
            if (hitStop) {
              break;
            }
          }

          if (columnConfig instanceof UnembeddingColumnConfig) {
            const {outputToken} = this.networkTokenRows[networkIndex][rowIndex];
            if (positionIndexRange !== undefined) {
              this.addNode(
                new PositionRangeNode({
                  networkIndex,
                  columnConfig,
                  rowConfig,
                  positionIndexRange,
                }),
              );
            } else {
              this.addNode(
                new UnembeddingNode({
                  networkIndex,
                  columnConfig,
                  rowConfig,
                  hasOutput: outputToken !== undefined,
                }),
              );
            }
          }

          if (columnConfig instanceof OutputTokenColumnConfig) {
            const {outputToken} = this.networkTokenRows[networkIndex][rowIndex];

            if (outputToken !== undefined) {
              const node = new OutputTokenNode({
                text: outputToken,
                networkIndex,
                columnConfig,
                rowConfig,
              });
              node.varStates.push(`network-${networkIndex}`);
              this.addNode(node);
            }
          }
        }
      }
    }
  }

  /**
   * Add a node by inserting it into the set of renderables and also into the
   * grid map.
   * @param {NetworkNode} patchingNetworkNode
   */
  addNode(patchingNetworkNode) {
    // Check if this node is tagged.
    for (const layerTag of this.layerTags) {
      if (nodeMatchesLayerTag(patchingNetworkNode, layerTag)) {
        patchingNetworkNode.varStates.push(layerTag.tag);
      }
    }

    this.addRenderable(patchingNetworkNode);
    const {
      networkIndex,
      rowConfig: {rowIndex},
      columnConfig: {columnIndex},
    } = patchingNetworkNode;
    this.nodeGridMap.set(
      `${networkIndex}-${rowIndex}-${columnIndex}`,
      patchingNetworkNode,
    );
  }

  /**
   * Get the patching network node at the provided row and column index.
   * @param {number} neworkIndex Index of the network.
   * @param {number} rowIndex Index of the grid row.
   * @param {number} columnIndex Index of the grid column.
   * @returns {NetworkNode} The node at that grid location.
   */
  getGridNode(networkIndex, rowIndex, columnIndex) {
    return this.nodeGridMap.get(`${networkIndex}-${rowIndex}-${columnIndex}`);
  }

  /**
   * Add the renderable to the set of renderables.
   * @param {Renderable} patchingNetworkRenderable
   */
  addRenderable(patchingNetworkRenderable) {
    this.renderables.set(
      patchingNetworkRenderable.getKey(),
      patchingNetworkRenderable,
    );
  }

  /**
   * Setup renderables representing connections between nodes. Called by
   * `setupRenderables()`.
   * @see setupRenderables()
   */
  setupIntraNetworkConnections() {
    const {
      patchingNetworkConfig: {networkConfigs},
    } = this;

    for (
      let networkIndex = 0;
      networkIndex < networkConfigs.length;
      networkIndex++
    ) {
      const networkConfig = networkConfigs[networkIndex];
      const {rowConfigs, columnConfigs} = networkConfig;

      for (let rowIndex = 0; rowIndex < rowConfigs.length; rowIndex++) {
        const rowConfig = rowConfigs[rowIndex];

        // NOTE: Only iterating up to the column before last.
        for (
          let columnIndex = 0;
          columnIndex < columnConfigs.length - 1;
          columnIndex++
        ) {
          const columnConfig = columnConfigs[columnIndex];

          const currentNetworkNode = this.getGridNode(
            networkIndex,
            rowIndex,
            columnIndex,
          );

          // Can't make connections from a missing node.
          if (!currentNetworkNode) {
            continue;
          }

          // Determine current node's applicable tags.
          const currentNetworkNodeTagSet = new Set();
          for (const layerTag of this.layerTags) {
            if (nodeMatchesLayerTag(currentNetworkNode, layerTag)) {
              currentNetworkNodeTagSet.add(layerTag.tag);
            }
          }

          // First, include the connection between this column and the next.
          const adjacentNetworkNode = this.getGridNode(
            networkIndex,
            rowIndex,
            columnIndex + 1,
          );

          if (
            adjacentNetworkNode &&
            !this.findPatches('to', adjacentNetworkNode).length
          ) {
            const connectionPart = new ConnectionPart({
              networkIndex,
              rowConfig,
              leftColumnConfig: columnConfig,
            });

            // Tag connection part if either end matches any layer tags.
            connectionPart.varStates.push(...currentNetworkNodeTagSet);
            for (const layerTag of this.layerTags) {
              if (
                !currentNetworkNodeTagSet.has(layerTag.tag) &&
                nodeMatchesLayerTag(adjacentNetworkNode, layerTag)
              ) {
                connectionPart.varStates.push(layerTag.tag);
              }
            }

            this.addRenderable(connectionPart);
          }

          const nextColumnConfig = columnConfig.nextNetworkColumnConfig;

          // Continue to make inter-row connections only if there are more rows,
          // and both this column and the next represent layers of the network.
          if (
            rowIndex >= rowConfigs.length - 1 ||
            !(columnConfig instanceof LayerColumnConfig) ||
            !(nextColumnConfig instanceof LayerColumnConfig)
          ) {
            // Skip.
            continue;
          }

          for (
            let otherRowIndex = rowIndex + 1;
            otherRowIndex <= rowConfigs.length;
            otherRowIndex++
          ) {
            const otherNetworkNode = this.getGridNode(
              networkIndex,
              otherRowIndex,
              columnIndex + 1,
            );

            // Can't connect to missing nodes.
            if (!otherNetworkNode) {
              continue;
            }

            // Don't connect if the output is a hidden state vector that has
            // been patched. Note though that if the other network node
            // represents skipped layers, we still want to see the connection
            // even if one of those layers has been patched.
            if (
              otherNetworkNode.columnConfig instanceof
                HiddenStateVectorColumnConfig &&
              this.findPatches('to', otherNetworkNode).length
            ) {
              continue;
            }

            // Add parts of the connection. Since renderables are stored in a
            // `Map` keyed by the renderables' `data-key`, duplicates will
            // overwrite previous connection parts.

            // First, create the outgoing connection part (downward curving
            // path). Add layer tags based on the egress node.
            const outgoingConnectionPart = new OutgoingConnectionPart({
              networkIndex,
              rowConfig,
              leftColumnConfig: columnConfig,
            });
            outgoingConnectionPart.varStates.push(...currentNetworkNodeTagSet);
            this.addRenderable(outgoingConnectionPart);

            // Create the intermediate, vertical connection parts.
            for (
              let intermediateRowIndex = rowIndex + 1;
              intermediateRowIndex < otherRowIndex;
              intermediateRowIndex++
            ) {
              const verticalConnectionPart = new VerticalConnectionPart({
                networkIndex,
                rowConfig: rowConfigs[intermediateRowIndex],
                leftColumnConfig: columnConfig,
              });
              verticalConnectionPart.varStates.push(
                ...currentNetworkNodeTagSet,
              );
              this.addRenderable(verticalConnectionPart);
            }

            const incomingConnectionPart = new IncomingConnectionPart({
              networkIndex,
              rowConfig: otherNetworkNode.rowConfig,
              leftColumnConfig: columnConfig,
            });
            incomingConnectionPart.varStates.push(...currentNetworkNodeTagSet);
            this.addRenderable(incomingConnectionPart);
          }
        }
      }
    }
  }

  /**
   * Add a patching connection between networks.
   *
   * Example patch object:
   *
   * ```
   * {
   *   from: {
   *     networkIndex: 0,
   *     positionIndex: 4,
   *     layerIndex: 1,
   *   },
   *   to: {
   *     networkIndex: 1,
   *     positionIndex: 37,
   *     layerIndex: 1,
   *   },
   * },
   * ```
   *
   * @param {object} patch Object with `from` and `to` entries.
   */
  addPatch(patch) {
    this.patchSet.add(patch);

    // NOTE: This code assumes that among patches, each `from` is unique.
    const fromKey = [
      patch.from.networkIndex,
      patch.from.positionIndex,
      patch.from.layerIndex,
    ].join('-');
    this.patchFromIndex.set(fromKey, patch);

    // NOTE: This code assumes that among patches, each `to` is unique.
    const toKey = [
      patch.to.networkIndex,
      patch.to.positionIndex,
      patch.to.layerIndex,
    ].join('-');
    this.patchToIndex.set(toKey, patch);
  }

  /**
   * Find any patches FROM a given network node of interest.
   * @param {'from'|'to'} endpoint Find patches from or to the given node.
   * @param {NetworkNode} patchingNetworkNode
   * @returns {object[]} Array of patch objects from this node.
   */
  findPatches(endpoint, patchingNetworkNode) {
    if (endpoint !== 'from' && endpoint !== 'to') {
      throw new Error('patch endpoint unrecognized');
    }

    const patches = [];

    for (const patch of this.patchSet) {
      if (nodeMatchesPatchEndpoint(patchingNetworkNode, patch[endpoint])) {
        patches.push(patch);
      }
    }

    return patches;
  }

  /**
   * Setup renderables representing patching connections between networks.
   * Called by `setupRenderables()`.
   * @see setupRenderables()
   */
  setupPatchingConnections() {
    for (const patch of this.patchSet) {
      const fromNode = this.findPatchEndpointNode(patch.from);

      if (!fromNode) {
        throw new Error("could not find node for 'from' patch endpoint");
      }

      const toNode = this.findPatchEndpointNode(patch.to);

      if (!toNode) {
        throw new Error("could not find node for 'to' patch endpoint");
      }

      this.addRenderable(
        new PatchConnection({
          fromNode,
          toNode,
        }),
      );
    }
  }

  /**
   * Search through the network node grid map for the node matching this patch
   * endpoint, if any.
   * @param {object} patchEndpoint Object specifying the patch endpoint.
   * @param {number} patchEndpoint.networkIndex
   * @param {number} patchEndpoint.positionIndex
   * @param {number} patchEndpoint.layerIndex
   * @returns {NetworkNode|undefined} The matching node if any.
   */
  findPatchEndpointNode(patchEndpoint) {
    for (const patchingNetworkNode of this.nodeGridMap.values()) {
      if (nodeMatchesPatchEndpoint(patchingNetworkNode, patchEndpoint)) {
        return patchingNetworkNode;
      }
    }
    return undefined;
  }
}
