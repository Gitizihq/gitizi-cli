import chalk from 'chalk';
import ora from 'ora';
import api from '../utils/api';
import { requireAuth } from '../utils/auth';
import { catThinking } from '../utils/cat';
import { ERRORS, MESSAGES, TIPS } from '../utils/constants';

interface SearchOptions {
  limit: string;
}

export async function searchCommand(query: string, options: SearchOptions): Promise<void> {
  try {
    requireAuth();

    console.log(chalk.cyan(catThinking));
    const spinner = ora(`Searching for "${query}"...`).start();

    try {
      const limit = parseInt(options.limit, 10);
      const response: any = await api.searchPrompts(query, limit);

      // Handle different possible API response formats
      let prompts: any[] = [];
      let total = 0;

      if (response && typeof response === 'object') {
        // Check if response has prompts array directly
        if (Array.isArray(response.prompts)) {
          prompts = response.prompts;
          total = response.total || prompts.length;
        }
        // Check if response itself is an array
        else if (Array.isArray(response)) {
          prompts = response;
          total = prompts.length;
        }
        // Check if response has data property
        else if (response.data) {
          if (Array.isArray(response.data.prompts)) {
            prompts = response.data.prompts;
            total = response.data.total || prompts.length;
          } else if (Array.isArray(response.data)) {
            prompts = response.data;
            total = prompts.length;
          }
        }
      }

      spinner.succeed(chalk.green(`Found ${total} prompt${total !== 1 ? 's' : ''}`));

      if (prompts.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PROMPTS_FOUND));
        return;
      }

      console.log(chalk.bold('\n📚 Search Results:\n'));

      prompts.forEach((prompt, index) => {
        console.log(chalk.bold.cyan(`${index + 1}. ${prompt.name || 'Untitled'}`));
        console.log(chalk.dim(`   ID: ${prompt.id}`));
        if (prompt.description) {
          console.log(chalk.white(`   ${prompt.description}`));
        }

        if (prompt.tags && Array.isArray(prompt.tags) && prompt.tags.length > 0) {
          const tags = prompt.tags.map((tag: string) => chalk.blue(`#${tag}`)).join(' ');
          console.log(`   ${tags}`);
        }

        const author = prompt.author || 'Unknown';
        const date = prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : 'Unknown date';
        console.log(chalk.dim(`   By ${author} • ${date}`));
        console.log();
      });

      console.log(chalk.dim(`\n${TIPS.CLONE_GENERAL}`));
    } catch (error: any) {
      spinner.fail(chalk.red(ERRORS.SEARCH_FAILED));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
