/**
 * @description sleeps for a certain amount of milliseconds
 */
export const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
