import chalk from 'chalk';
import ora from 'ora';
import api from '../utils/api';
import { requireAuth } from '../utils/auth';
import { catThinking } from '../utils/cat';
import { TIPS } from '../utils/constants';

interface ListOptions {
  limit: string;
}

export async function listCommand(options: ListOptions): Promise<void> {
  try {
    requireAuth();

    console.log(chalk.cyan(catThinking));
    const spinner = ora('Fetching your prompts...').start();

    try {
      const prompts = await api.listUserPrompts();
      const limit = parseInt(options.limit, 10);
      const displayPrompts = prompts.slice(0, limit);

      spinner.succeed(chalk.green(`Found ${prompts.length} prompts`));

      if (prompts.length === 0) {
        console.log(chalk.yellow('\nYou haven\'t created any prompts yet.'));
        console.log(chalk.dim('Create one with: izi push <file>'));
        return;
      }

      console.log(chalk.bold('\n📚 Your Prompts:\n'));

      displayPrompts.forEach((prompt, index) => {
        console.log(chalk.bold.cyan(`${index + 1}. ${prompt.name}`));
        console.log(chalk.dim(`   ID: ${prompt.id}`));
        console.log(chalk.white(`   ${prompt.description}`));

        if (prompt.tags && prompt.tags.length > 0) {
          const tags = prompt.tags.map(tag => chalk.blue(`#${tag}`)).join(' ');
          console.log(`   ${tags}`);
        }

        console.log(chalk.dim(`   Updated: ${new Date(prompt.updatedAt).toLocaleDateString()}`));
        console.log();
      });

      if (prompts.length > limit) {
        console.log(chalk.dim(`\nShowing ${limit} of ${prompts.length} prompts. Use --limit to see more.`));
      }

      console.log(chalk.dim(TIPS.CLONE_GENERAL));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to fetch prompts'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
