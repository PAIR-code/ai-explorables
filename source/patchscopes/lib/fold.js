/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Utility function to combine array items by splicing in place.
 */

/**
 * Given an `array`, walk backwards finding items that can be folded together
 * according to the output of the `testFn`. When a range of foldable items is
 * found, invoke `foldFn` to create a replacement object, then splice it into
 * the array to replace the foldable items.
 * @param {unknown[]} array Array of items to fold.
 * @param {(unknown) => boolean} keepFn Determines if item is kept unfolded.
 * @param {(unknown[], number, number) => unknown} replaceFn Returns an item to
 * splice in place over folded items.
 * @param {number} minIndexRange Minimum range to invoke `foldFn`.
 */
export function fold(array, keepFn, replaceFn, minIndexRange = 1) {
  let rangeEndIndex = undefined;
  for (let i = array.length - 1; i >= 0; i--) {
    const keep = keepFn(array[i]);

    if (rangeEndIndex === undefined) {
      if (!keep) {
        rangeEndIndex = i;
      }
      continue;
    }

    if (!keep && i > 0) {
      continue;
    }

    const rangeStartIndex = i === 0 && keep ? 0 : i + 1;

    if (rangeEndIndex - rangeStartIndex - minIndexRange >= 0) {
      const replacementItem = replaceFn(array, rangeStartIndex, rangeEndIndex);
      array.splice(
        rangeStartIndex,
        rangeEndIndex - rangeStartIndex + 1,
        replacementItem,
      );
    }

    rangeEndIndex = undefined;
  }
}
