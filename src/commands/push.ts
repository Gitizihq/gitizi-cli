import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import api from '../utils/api';
import { requireAuth } from '../utils/auth';
import { catHappy } from '../utils/cat';
import { parseFrontmatter } from '../utils/frontmatter';
import { validatePromptData, validateFileExtension } from '../utils/validation';
import { ERRORS, MESSAGES, TIPS, URLS } from '../utils/constants';

interface PushOptions {
  id?: string;
}

export async function pushCommand(file: string, options: PushOptions): Promise<void> {
  try {
    requireAuth();

    // Validate file extension
    const extError = validateFileExtension(file);
    if (extError) {
      console.error(chalk.red(extError.message));
      process.exit(1);
    }

    // Check if file exists
    const filePath = path.resolve(file);
    try {
      await fs.access(filePath);
    } catch {
      console.error(chalk.red(ERRORS.FILE_NOT_FOUND(file)));
      process.exit(1);
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter
    const parsed = parseFrontmatter(content);
    let name = parsed.metadata.name;
    let description = parsed.metadata.description;
    let tags = parsed.metadata.tags || [];
    const promptContent = parsed.content;

    // Prompt for missing information
    const questions: any[] = [];

    if (!name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Prompt name:',
        validate: (input: string) => input.trim() !== '' || ERRORS.NAME_REQUIRED,
      });
    }

    if (!description) {
      questions.push({
        type: 'input',
        name: 'description',
        message: 'Prompt description:',
        validate: (input: string) => input.trim() !== '' || ERRORS.DESCRIPTION_REQUIRED,
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
      const answers = await inquirer.prompt(questions);
      name = name || answers.name;
      description = description || answers.description;
      if (answers.tags) {
        tags = answers.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      }
    }

    // Validate the prompt data
    const validationErrors = validatePromptData({
      name,
      description,
      content: promptContent,
      tags,
    });

    if (validationErrors.length > 0) {
      console.error(chalk.red('❌ Validation errors:'));
      validationErrors.forEach(err => {
        console.error(chalk.red(`  - ${err.message}`));
      });
      process.exit(1);
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
        spinner.succeed(chalk.green(MESSAGES.PROMPT_UPDATED));
      } else {
        // Create new prompt
        result = await api.createPrompt({
          name: name!,
          description: description!,
          content: promptContent,
          tags,
        });
        spinner.succeed(chalk.green(MESSAGES.PROMPT_PUSHED));
      }

      console.log(chalk.cyan(catHappy));
      console.log(chalk.bold.cyan('\n📝 Prompt Details:'));
      console.log(chalk.white(`  Name: ${result.name}`));
      console.log(chalk.white(`  ID: ${result.id}`));
      console.log(chalk.white(`  URL: ${URLS.PROMPTS(result.id)}`));
      console.log(chalk.dim(`\n${TIPS.CLONE(result.id)}`));
    } catch (error: any) {
      spinner.fail(chalk.red(options.id ? ERRORS.UPDATE_FAILED : ERRORS.PUSH_FAILED));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
