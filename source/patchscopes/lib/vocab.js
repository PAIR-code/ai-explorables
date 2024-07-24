/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Maintain and query an experiment's vocabulary.
 */

/**
 * A Vocab maps token ids (non-negative integers) to token strings.
 */
export class Vocab {
  constructor() {
    /**
     * Mapping from id numbers to strings. Duplicates are forbidden.
     * @type {Map}
     */
    this.tokenIdToStringMap = new Map();

    /**
     * Inverse mapping from token strings to arrays of matching ids. It is
     * unknown whether duplicates will occur or what that means.
     */
    this.tokenStringToIdsMap = new Map();
  }

  /**
   * Set a given token id to map to the provided token string.
   * @param {number} tokenId Token id number to set.
   * @param {string} tokenString Token string to which the id maps.
   * @throws {RangeError} If tokenId is not a non-negative integer.
   * @throws {TypeError} If tokenString is not a string.
   * @throws {Error} If tokenId has already been set.
   */
  set(tokenId, tokenString) {
    if (!Number.isInteger(tokenId) || tokenId < 0) {
      throw new RangeError('tokenId is not a non-negative integer');
    }

    if (typeof tokenString !== 'string') {
      throw new TypeError('tokenString is not a string');
    }

    if (this.hasId(tokenId)) {
      throw new Error('tokenId has already been added');
    }

    this.tokenIdToStringMap.set(tokenId, tokenString);

    let ids = this.tokenStringToIdsMap.get(tokenString);
    if (!ids) {
      ids = [];
      this.tokenStringToIdsMap.set(tokenString, ids);
    }
    ids.push(tokenString);
  }

  /**
   * For a given token id and token string, check to see if that association has
   * already been set. If so, do nothing. If not, set it. If the token id has
   * already been set to a different string, throw.
   * @param {number} tokenId Token id number to set.
   * @param {string} tokenString Token string to which the id maps.
   * @throws {Error} If tokenId has already been set to a different string.
   */
  add(tokenId, tokenString) {
    if (this.hasId(tokenId)) {
      if (this.getString(tokenId) === tokenString) {
        // Nothing to do.
        return;
      }
      throw new Error('tokenId is already set to a different string');
    }
    this.set(tokenId, tokenString);
  }

  /**
   * Given an array of token ids and a matching array of token strings, set all
   * of the unset token ids to those token strings.
   * @param {number[]} tokenIds Token ids to add.
   * @param {string[]} tokenStrings Token strings to add.
   * @throws {Error} If the two arrays are of different length.
   */
  addAll(tokenIds, tokenStrings) {
    if (
      !Array.isArray(tokenIds) ||
      !Array.isArray(tokenStrings) ||
      tokenIds.length !== tokenStrings.length
    ) {
      throw new Error('arguments are not equal length arrays');
    }

    for (let i = 0; i < tokenIds.length; i++) {
      this.add(tokenIds[i], tokenStrings[i]);
    }
  }

  /**
   * Determine whether a given token id has been set.
   * @param {number} tokenId Token id for which to check.
   * @returns Whether that token id has been set.
   */
  hasId(tokenId) {
    return this.tokenIdToStringMap.has(tokenId);
  }

  /**
   * Determine whether a given token string has been set for any token id.
   * @param {string} tokenString Token string for which to check.
   * @returns Whether that tokenString has been set for any token id.
   */
  hasString(tokenString) {
    return this.tokenStringToIdsMap.has(tokenString);
  }

  /**
   * Get the token string associated with a given token id.
   * @param {number} tokenId The token id to find.
   * @returns Either the assocaited token string, or unefined if not set.
   */
  getString(tokenId) {
    return this.tokenIdToStringMap.get(tokenId);
  }

  /**
   * Get an array of token ids associated with a given token string.
   * @param {string} tokenString The token string to find.
   * @returns Array of matching token ids, may be empty.
   */
  getIds(tokenString) {
    return this.tokenStringToIdsMap.get(tokenString) ?? [];
  }
}
