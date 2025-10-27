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

      // Handle Gitizi database response format
      let prompts: any[] = [];
      let total = 0;

      if (response && typeof response === 'object') {
        // Gitizi API returns { data: [...] }
        if (Array.isArray(response.data)) {
          prompts = response.data;
          total = prompts.length;
        }
        // Legacy format: { prompts: [...], total: N }
        else if (Array.isArray(response.prompts)) {
          prompts = response.prompts;
          total = response.total || prompts.length;
        }
        // Direct array
        else if (Array.isArray(response)) {
          prompts = response;
          total = prompts.length;
        }
      }

      spinner.succeed(chalk.green(`Found ${total} prompt${total !== 1 ? 's' : ''}`));

      if (prompts.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PROMPTS_FOUND));
        return;
      }

      console.log(chalk.bold('\nSearch Results:\n'));

      prompts.forEach((prompt, index) => {
        // Support both formats: title/name, summary/description
        const title = prompt.title || prompt.name || 'Untitled';
        const summary = prompt.summary || prompt.description || '';
        const owner = prompt.owner_id || prompt.author || 'Unknown';
        const createdDate = prompt.created_at || prompt.createdAt;

        console.log(chalk.bold.cyan(`${index + 1}. ${title}`));
        console.log(chalk.dim(`   Slug: ${prompt.slug || prompt.id}`));

        if (summary) {
          // Truncate long summaries
          const maxLength = 100;
          const displaySummary = summary.length > maxLength
            ? summary.substring(0, maxLength) + '...'
            : summary;
          console.log(chalk.white(`   ${displaySummary}`));
        }

        if (prompt.tags && Array.isArray(prompt.tags) && prompt.tags.length > 0) {
          const tags = prompt.tags.slice(0, 5).map((tag: string) => chalk.blue(`#${tag}`)).join(' ');
          console.log(`   ${tags}`);
        }

        const date = createdDate ? new Date(createdDate).toLocaleDateString() : '';
        console.log(chalk.dim(`   ${date}${prompt.star_count ? ` • ⭐ ${prompt.star_count}` : ''}`));
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
