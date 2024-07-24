/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Fetches data files, with cacheing.
 */

/**
 * Fetches static data resources and caches results.
 */
export class Fetcher {
  constructor() {
    /**
     * Mapping of URLs to fetch response promises.
     * @type {Map<string, Promise<Response>>}
     * @see init()
     */
    this.fetchResponseMap = new Map();
  }

  /**
   * Fetches the provided URL, returns cached value.
   * @param {string} url The URL to fetch.
   */
  async fetch(url) {
    let responsePromise = this.fetchResponseMap.get(url);

    if (!responsePromise) {
      responsePromise = fetch(url);
      this.fetchResponseMap.set(url, responsePromise);
    }

    const response = await responsePromise;
    return response.clone();
  }
}
