/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Coordinator object for registering vis types for rendering.
 */

import {renderError} from './render-error.js';

/**
 * Bespoke MIME type for visualization specification JSON.
 */
export const VIS_SCRIPT_JSON_MIME_TYPE = 'application/x-vis+json';

/**
 * Coordinator object for registering vis rendering functions.
 *
 * The objective of this approach is to permit configurability within the
 * shared doc and afford registering different visualizaiton types. This should
 * for rapid experimentation of configurable visualizations by collaborators.
 *
 * Example class usage:
 *
 * ```
 * const renderer = new VisRenderer();
 *
 * async function demoVis(containerElem, configJson) {
 *   const pre = containerElem.ownerDocument.createElement('pre');
 *   pre.textContent = JSON.stringify(configJson);
 *   containerElem.appendChild(pre);
 * }
 *
 * renderer.registerRenderFunction('demo', demoVis);
 *
 * renderer.renderAllScripts();
 * ```
 *
 * Example script tag that would cause `demoVis()` to render:
 *
 * ```
 * <script type="application/x-vis+json">
 * {
 *   "type": "demo"
 * }
 * </script>
 * ```
 */
export class VisRenderer {
  constructor() {
    /**
     * Mapping from visualization type string to callback function for
     * rendering. Callback functions may be asynchronous.
     * @see registerRenderFunction();
     */
    this.rendererFnMap = new Map();
  }

  /**
   * Register a vis rendering callback function for a particular vis type. The
   * type of visualization is specified in the `type` field of the JSON in the
   * originating document.
   *
   * ```
   * <script type="application/x-vis+json">
   * {
   *   "type": "demo"
   * }
   * </script>
   * ```
   *
   * It this example, the VisRenderer would invoke the callback registered to
   * the `"demo"` type string.
   *
   * @param {string} visType
   * @param {Function} renderFn
   * @throws {Error} If the `type` has already been registered.
   */
  registerRenderFunction(visType, renderFn) {
    if (this.rendererFnMap.has(visType)) {
      throw new Error(`type already registered: ${JSON.stringify(visType)}`);
    }
    this.rendererFnMap.set(visType, renderFn);
  }

  /**
   * For each entry in the `mappingObject`, register the render function value
   * under the vis type key.
   * @param {Record<string,Function>} mappingObject Map from type to render fns.
   */
  register(mappingObject) {
    for (const visType in mappingObject) {
      this.registerRenderFunction(visType, mappingObject[visType]);
    }
  }

  /**
   * Find all scripts within the specified container element that contain
   * visualization specifications and render them.
   * @param {Element} containerElement The container to search (document).
   */
  async renderAllScripts(containerElement = document) {
    const scripts = Array.from(
      containerElement.querySelectorAll(
        `script[type="${VIS_SCRIPT_JSON_MIME_TYPE}"]`,
      ),
    );
    return Promise.all(
      scripts.map((scriptElem) => this.renderVisFromScriptElem(scriptElem)),
    );
  }

  /**
   * Render a visualization from the contents of the provided script element
   * into a container div, and insert that div as the next sibling of the
   * script.
   *
   * @param {HTMLScriptElement} scriptElem The script element to render.
   */
  async renderVisFromScriptElem(scriptElem) {
    // Div to contain the visualization or error if any. Injected into the DOM
    // immediately after the script tag.
    const containerDiv = scriptElem.ownerDocument.createElement('div');
    containerDiv.setAttribute('data-role', 'vis-container');
    scriptElem.parentElement.insertBefore(
      containerDiv,
      scriptElem.nextElementSibling,
    );

    const scriptText = scriptElem.textContent.trim();
    try {
      // May throw a SytnaxError if not valid JSON.
      const scriptJson = JSON.parse(scriptText);

      // May throw an Error if vis config is malformed or for any other reason.
      await this.renderVisFromJson(containerDiv, scriptJson);
    } catch (err) {
      renderError(containerDiv, err, scriptText);
      queueMicrotask(() => {
        throw err;
      });
    }
  }

  /**
   * Given a visualization specification JSON, determine its type, then render
   * the registered vis for that type, passing along the container element into
   * which to render.
   * @param {Element} containerElem The container element into which to render.
   * @param {Object} configJson Parsed JSON config object specified in the doc.
   * @throws {Error} If configJson is missing or falsey.
   * @throws {Error} If configJson lacks a `type` field with string value.
   * @throws {Error} If there is no matching render function for `type`.
   */
  async renderVisFromJson(containerElem, configJson) {
    if (!configJson) {
      throw new Error('config JSON is missing');
    }

    const {type} = configJson;

    if (typeof type !== 'string') {
      throw new Error('config JSON type field is missing');
    }

    const renderFn = this.rendererFnMap.get(type);

    if (!renderFn) {
      throw new Error(
        `render function missing for type ${JSON.stringify(type)}`,
      );
    }

    return renderFn(containerElem, configJson);
  }
}
