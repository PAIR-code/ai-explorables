/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Base class of renderable elements of the patching network vis.
 */

/**
 * Default namespace to use for CSS variables.
 */
const DEFAULT_CSS_VAR_NAMESPACE = 'exp';

/**
 * Base class representing a renderable element of a patching network. May be a
 * node, such as a hidden state vector (circle), a textual label, such as an
 * input token, or a curved arrow connecting patched nodes.
 */
export class Renderable {
  /**
   * @param {string} varNamespace Namespace prefix string for nested CSS vars.
   */
  constructor({varNamespace} = {}) {
    /**
     * Namespace for nested CSS `var()` values.
     * @type {string}
     */
    this.varNamespace = varNamespace ?? DEFAULT_CSS_VAR_NAMESPACE;

    /**
     * Optional states for rendering attribute var chains.
     * @type {string[]}
     */
    this.varStates = [];

    /**
     * Names of internal attributes, to be exposed for styling via var chains.
     *
     * For example, if a renderable produces text, then an internal attribute
     * might be `font-size`. The internal element `<text>` would have its
     * `font-size` style attribute set to `var(--_font-size)`. Then, the
     * containing `<g>` would define `--_font-size` using var chaining based on
     * the namespace, class and states.
     * @type {string[]}
     */
    this.internalAttributes = [];

    /**
     * Name of this class. Set on first call to `getClassName()`.
     * @type {string}
     */
    this.className = undefined;

    /**
     * Map storing previously set var values. Speeds lookups.
     * @type {Map}
     */
    this.varMap = new Map();
  }

  /**
   * Method invoked by `selection.each()` for entering elements. Should be
   * overridden by child classes.
   * @param {SVGGElement} groupElement Group element parent of this renderable.
   * @see https://devdocs.io/d3~4/d3-selection#selection_each
   */
  enter(groupElement) {
    // Default behavior is to do nothing.
  }

  /**
   * Method invoked by `selection.each()` for the merged selection of entering
   * elements as well as elements strictly needing update. Should be overriden
   * by child classes.
   * @param {SVGGElement} groupElement Group element parent of this renderable.
   * @see https://devdocs.io/d3~4/d3-selection#selection_each
   */
  update(groupElement) {
    // Set inheritable internal attributes.
    const {style} = groupElement;
    for (const internalAttribute of this.internalAttributes) {
      const varName = `--_${internalAttribute}`;
      const varValue = this.getVarValue(internalAttribute);
      if (this.varMap.get(varName) !== varValue) {
        this.varMap.set(varName);
        style.setProperty(varName, varValue);
      }
    }
  }

  /**
   * Method invoked by `selection.each()` for the selection of exiting elements.
   * Should be overriden by child classes.
   * @param {SVGGElement} groupElement Group element parent of this renderable.
   * @see https://devdocs.io/d3~4/d3-selection#selection_each
   */
  exit(groupElement) {
    // Default behavior is to do nothing.
  }

  /**
   * Converts instance's class name to prefix for `getKey()` method.
   * @return {string} Class name converted from CamelCase to dashed-lower-case.
   */
  getClassName() {
    if (this.className !== undefined) {
      return this.className;
    }

    // Find instances where an uppercase letter follows a lowercase letter,
    // insert a hyphen, and then lowercase the whole string. For example,
    // `ClassName` becomes `class-name`.
    this.className = this.constructor.name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    return this.className;
  }

  /**
   * Provides a key string for D3 data binding. Must be overridden in child
   * classes. Should incorporate the result of `getClassName()`.
   * @return {string} Key for identifying this object in the visualization.
   * @see https://devdocs.io/d3~4/d3-selection#selection_data
   */
  getKey() {
    throw new Error('getKey method not implemented');
  }

  /**
   * Produce a nested CSS `var()` attribute value based on the result of
   * `getVarStates()` for the given attribute name suffix.
   *
   * For example, if `getVarStates()` returns undefined (the default value) then
   * this method will return something like
   * `var(--exp-class-name-default-attribute-suffix)` where `exp` is the
   * namespace, `class-name` is the result of calling `getClassName()` and
   * `attribute-suffix` is the provided string. If `getVarStates()` returns
   * `['hovered']`, then this method will return something like:
   *
   * ```
   * var(--exp-class-name-hovered-attribute-suffix,
   *   var(--exp-class-name-default-attribute-suffix)
   * )
   * ```
   *
   * Note that whitespace has been added for legibility only.
   *
   * @param {string} attributeSuffix Name suffix of the attribute to generate.
   * @returns
   */
  getVarValue(attributeSuffix) {
    const prefix = `${this.varNamespace}-${this.getClassName()}`;
    const varStates = [...this.varStates, 'default'];
    const vars = varStates.map(
      (varState) => `var(--${prefix}-${varState}-${attributeSuffix}`,
    );
    return `${vars.join(',')}${')'.repeat(vars.length)}`;
  }
}

/**
 * D3 key function for data binding.
 * @param {Element|Renderable} elementOrRenderable DOM node or
 * renderable to bind.
 * @returns {string} Key for binding.
 */
export function getRenderableKey(elementOrRenderable) {
  if (elementOrRenderable instanceof Element) {
    const key = elementOrRenderable.getAttribute('data-key');
    if (key === null) {
      throw new Error('data-key attribute missing');
    }
    return key;
  }
  return elementOrRenderable.getKey();
}
