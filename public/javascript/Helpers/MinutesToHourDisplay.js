/**
 * @return {string}
 */
export function MinutesToHourDisplay(input) {
  const hours = Math.floor(input / 60).toString();
  const minutes = (input % 60).toString();
  return `${hours.length === 2 ? hours : '0' + hours}:${minutes.length === 2 ? minutes : '0' + minutes}`;
}