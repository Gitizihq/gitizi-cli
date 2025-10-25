import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import api from '../utils/api';
import { requireAuth } from '../utils/auth';
import { catHappy } from '../utils/cat';
import { generateFrontmatter } from '../utils/frontmatter';
import { ERRORS, MESSAGES, TIPS } from '../utils/constants';

interface CloneOptions {
  output: string;
}

export async function cloneCommand(promptId: string, options: CloneOptions): Promise<void> {
  try {
    requireAuth();

    const spinner = ora(`Cloning prompt ${promptId}...`).start();

    try {
      const prompt = await api.getPrompt(promptId);

      // Create markdown with frontmatter using the utility
      const markdownContent = generateFrontmatter(
        {
          name: prompt.name,
          description: prompt.description,
          tags: prompt.tags,
          author: prompt.author,
          id: prompt.id,
        },
        prompt.content
      );

      // Write to file
      const outputPath = path.resolve(options.output);
      await fs.writeFile(outputPath, markdownContent, 'utf-8');

      spinner.succeed(chalk.green(MESSAGES.PROMPT_CLONED));
      console.log(chalk.cyan(catHappy));
      console.log(chalk.bold.cyan('\n📥 Cloned Prompt:'));
      console.log(chalk.white(`  Name: ${prompt.name}`));
      console.log(chalk.white(`  Author: ${prompt.author}`));
      console.log(chalk.white(`  File: ${outputPath}`));

      if (prompt.tags.length > 0) {
        console.log(chalk.blue(`  Tags: ${prompt.tags.map(t => '#' + t).join(' ')}`));
      }

      console.log(chalk.dim(`\n${TIPS.PUSH_UPDATE(options.output, prompt.id)}`));
    } catch (error: any) {
      spinner.fail(chalk.red(ERRORS.CLONE_FAILED));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
