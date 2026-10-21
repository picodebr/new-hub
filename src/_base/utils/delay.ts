/**
 * Wait for a certain amount of time to resolve the promise
 * @param time amout of time in milliseconds to wait
 * @returns a promise that will be resolved when the given amount
 * of time has passed
 */

export const delay = (time: number) =>
  new Promise(res => setTimeout(res, time));
