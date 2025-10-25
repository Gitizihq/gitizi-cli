import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import api from '../utils/api';
import { getToken } from '../utils/config';
import { catHappy } from '../utils/cat';

interface PushOptions {
  id?: string;
}

export async function pushCommand(file: string, options: PushOptions): Promise<void> {
  try {
    const token = getToken();
    if (!token) {
      console.error(chalk.red('❌ Not authenticated. Please run: izi auth'));
      process.exit(1);
    }

    // Check if file exists
    const filePath = path.resolve(file);
    try {
      await fs.access(filePath);
    } catch {
      console.error(chalk.red(`❌ File not found: ${file}`));
      process.exit(1);
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter
    let name: string | undefined;
    let description: string | undefined;
    let tags: string[] = [];
    let promptContent = content;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      promptContent = frontmatterMatch[2];

      const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
      if (nameMatch) name = nameMatch[1].trim();

      const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
      if (descMatch) description = descMatch[1].trim();

      const tagsMatch = frontmatter.match(/^tags:\s*\[(.+)\]$/m);
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
      }
    }

    // Prompt for missing information
    const questions = [];

    if (!name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Prompt name:',
        validate: (input: string) => input.trim() !== '' || 'Name is required',
      });
    }

    if (!description) {
      questions.push({
        type: 'input',
        name: 'description',
        message: 'Prompt description:',
        validate: (input: string) => input.trim() !== '' || 'Description is required',
      });
    }

    if (tags.length === 0) {
      questions.push({
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):',
        default: '',
      });
    }

    if (questions.length > 0) {
      // Type assertion to handle inquirer's complex types
      const answers = await inquirer.prompt(questions as any);
      name = name || answers.name;
      description = description || answers.description;
      if (answers.tags) {
        tags = answers.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      }
    }

    const spinner = ora(options.id ? 'Updating prompt...' : 'Pushing prompt...').start();

    try {
      let result;

      if (options.id) {
        // Update existing prompt
        result = await api.updatePrompt(options.id, {
          name,
          description,
          content: promptContent,
          tags,
        });
        spinner.succeed(chalk.green('Prompt updated successfully!'));
      } else {
        // Create new prompt
        result = await api.createPrompt({
          name: name!,
          description: description!,
          content: promptContent,
          tags,
        });
        spinner.succeed(chalk.green('Prompt pushed successfully!'));
      }

      console.log(chalk.cyan(catHappy));
      console.log(chalk.bold.cyan('\n📝 Prompt Details:'));
      console.log(chalk.white(`  Name: ${result.name}`));
      console.log(chalk.white(`  ID: ${result.id}`));
      console.log(chalk.white(`  URL: https://gitizi.com/prompts/${result.id}`));
      console.log(chalk.dim(`\n💡 Share your prompt or clone it with: izi clone ${result.id}`));
    } catch (error: any) {
      spinner.fail(chalk.red(options.id ? 'Update failed' : 'Push failed'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
