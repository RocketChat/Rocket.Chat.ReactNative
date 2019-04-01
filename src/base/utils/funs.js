export function isArray(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
}
