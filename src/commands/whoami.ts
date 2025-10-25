import chalk from 'chalk';
import ora from 'ora';
import api from '../utils/api';
import { requireAuth } from '../utils/auth';
import { getUsername } from '../utils/config';
import { catAscii } from '../utils/cat';

export async function whoamiCommand(): Promise<void> {
  try {
    requireAuth();

    const spinner = ora('Fetching user info...').start();

    try {
      const user = await api.getCurrentUser();
      spinner.succeed(chalk.green('User info retrieved'));

      console.log(chalk.cyan(catAscii));
      console.log(chalk.bold.cyan('\n👤 Current User:'));
      console.log(chalk.white(`  Username: ${user.username}`));
      if (user.email) {
        console.log(chalk.white(`  Email: ${user.email}`));
      }
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch user info'));

      // Fallback to stored username
      const username = getUsername();
      if (username) {
        console.log(chalk.yellow('\n⚠ Using cached user info:'));
        console.log(chalk.white(`  Username: ${username}`));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
