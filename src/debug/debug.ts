import moment from 'moment';
import chalk from 'chalk';

const debugDisabled = false;

export const debug = (
  text: string,
  type: 'log' | 'warn' | 'error' = 'log'
): void => {
  if (debugDisabled) return;
  const date = `${moment().format()}:`;
  const log2: string = `${chalk.bold(date)} ${text}`;
  if (type === 'log') {
    console.log(chalk.white(`${log2}`));
  } else if (type === 'warn') {
    console.log(chalk.yellow(`${log2}`));
  } else if (type === 'error') {
    console.log(chalk.red(`${log2}`));
  }
};
