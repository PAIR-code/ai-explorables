/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Main entry point for patching explorable code.
 */

import {Fetcher} from './lib/fetcher.js';
import {VisRenderer} from './lib/vis-renderer.js';
import {countdownVis} from './vis/countdown/countdown-vis.js';
import {entityDescriptionVis} from './vis/entity-description/entity-description.js';
import {flatGridVis} from './vis/flat-grid/flat-grid-vis.js';
import {gridVis} from './vis/grid/grid-vis.js';
import {simpleTransformerVis} from './vis/simple-transformer/simple-transformer-vis.js';
import {multihopVis} from './vis/multihop/multihop-vis.js';
import {probingVsPatching} from './vis/probing-vs-patching/probing-vs-patching.js';
import {entityDescriptionInteractiveVis} from './vis/entity-description/entity_description_interactive.js';
import {entityDescriptionScoresVis} from './vis/entity-description/entity_description_scores.js';
import {tokensVis} from './vis/tokens/tokens.js';
import {patchingNetworkVis} from './vis/patching-network/patching-network-vis.js';
import {multihopSingleVis} from './vis/multihop/multihop-single-vis.js';
import {patchingWalkthroughkVis} from './vis/patching-network/patching-walkthrough-vis.js';
import {multihopDiffVis} from './vis/multihop/multihop-diff-vis.js';
import {probingVsPatchingIntro} from './vis/probing-vs-patching/probing-vs-patching-intro.js';
import {transformerWalkthroughkVis} from './vis/patching-network/transformer-walkthrough-vis.js';

const renderer = new VisRenderer();
const fetcher = new Fetcher();

// Register visualization render functions.
// NOTE: Don't forget to @include CSS styles in neighboring `./style.css`.
renderer.register({
  'countdown': countdownVis,
  'flat-grid': flatGridVis(fetcher),
  'grid': gridVis(fetcher),
  'simple-transformer': simpleTransformerVis(fetcher),
  'multihop': multihopVis(fetcher),
  'probing-vs-patching': probingVsPatching(),
  'probing-vs-patching-intro': probingVsPatchingIntro(),
  'entity-description': entityDescriptionVis(fetcher),
  'entity-description-interactive': entityDescriptionInteractiveVis(fetcher),
  'entity-description-scores': entityDescriptionScoresVis(fetcher),
  'tokens': tokensVis(fetcher),
  'patching-network': patchingNetworkVis,
  'patching-walkthrough': patchingWalkthroughkVis(fetcher),
  'multihop-single': multihopSingleVis(fetcher),
  'multihop-diff': multihopDiffVis(fetcher),
  'transformer-walkthrough': transformerWalkthroughkVis(fetcher),
});

renderer.renderAllScripts();
