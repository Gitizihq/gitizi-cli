import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import api from '../utils/api';
import { getToken } from '../utils/config';
import { catHappy } from '../utils/cat';

interface CloneOptions {
  output: string;
}

export async function cloneCommand(promptId: string, options: CloneOptions): Promise<void> {
  try {
    const token = getToken();
    if (!token) {
      console.error(chalk.red('❌ Not authenticated. Please run: izi auth'));
      process.exit(1);
    }

    const spinner = ora(`Cloning prompt ${promptId}...`).start();

    try {
      const prompt = await api.getPrompt(promptId);

      // Create markdown with frontmatter
      const frontmatter = `---
name: ${prompt.name}
description: ${prompt.description}
tags: [${prompt.tags.join(', ')}]
author: ${prompt.author}
id: ${prompt.id}
---

`;

      const markdownContent = frontmatter + prompt.content;

      // Write to file
      const outputPath = path.resolve(options.output);
      await fs.writeFile(outputPath, markdownContent, 'utf-8');

      spinner.succeed(chalk.green('Prompt cloned successfully!'));
      console.log(chalk.cyan(catHappy));
      console.log(chalk.bold.cyan('\n📥 Cloned Prompt:'));
      console.log(chalk.white(`  Name: ${prompt.name}`));
      console.log(chalk.white(`  Author: ${prompt.author}`));
      console.log(chalk.white(`  File: ${outputPath}`));
      
      if (prompt.tags.length > 0) {
        console.log(chalk.blue(`  Tags: ${prompt.tags.map(t => '#' + t).join(' ')}`));
      }

      console.log(chalk.dim(`\n💡 Edit the prompt and push changes with: izi push ${options.output} --id ${prompt.id}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Clone failed'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
