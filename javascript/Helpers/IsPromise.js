/**
 * Returns whether the thing given is a Promise
 * @param obj
 * @returns {boolean}
 */
export function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}
