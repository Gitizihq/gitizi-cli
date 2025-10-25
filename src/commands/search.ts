import chalk from 'chalk';
import ora from 'ora';
import api from '../utils/api';
import { getToken } from '../utils/config';
import { catThinking } from '../utils/cat';

interface SearchOptions {
  limit: string;
}

export async function searchCommand(query: string, options: SearchOptions): Promise<void> {
  try {
    const token = getToken();
    if (!token) {
      console.error(chalk.red('❌ Not authenticated. Please run: izi auth'));
      process.exit(1);
    }

    console.log(chalk.cyan(catThinking));
    const spinner = ora(`Searching for "${query}"...`).start();

    try {
      const limit = parseInt(options.limit, 10);
      const results = await api.searchPrompts(query, limit);

      spinner.succeed(chalk.green(`Found ${results.total} prompts`));

      if (results.prompts.length === 0) {
        console.log(chalk.yellow('\nNo prompts found matching your query.'));
        return;
      }

      console.log(chalk.bold('\n📚 Search Results:\n'));

      results.prompts.forEach((prompt, index) => {
        console.log(chalk.bold.cyan(`${index + 1}. ${prompt.name}`));
        console.log(chalk.dim(`   ID: ${prompt.id}`));
        console.log(chalk.white(`   ${prompt.description}`));
        
        if (prompt.tags && prompt.tags.length > 0) {
          const tags = prompt.tags.map(tag => chalk.blue(`#${tag}`)).join(' ');
          console.log(`   ${tags}`);
        }
        
        console.log(chalk.dim(`   By ${prompt.author} • ${new Date(prompt.createdAt).toLocaleDateString()}`));
        console.log();
      });

      console.log(chalk.dim(`\n💡 Tip: Use "izi clone <prompt-id>" to download a prompt`));
    } catch (error: any) {
      spinner.fail(chalk.red('Search failed'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
