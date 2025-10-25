import chalk from 'chalk';
import { clearConfig } from '../utils/config';
import { catSad } from '../utils/cat';

export async function logoutCommand(): Promise<void> {
  try {
    clearConfig();
    console.log(chalk.cyan(catSad));
    console.log(chalk.green('✓ Successfully logged out'));
    console.log(chalk.dim('All stored credentials have been cleared.'));
    console.log(chalk.dim('\nTo log back in, run: izi auth'));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
