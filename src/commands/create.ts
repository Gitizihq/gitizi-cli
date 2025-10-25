import chalk from 'chalk';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth } from '../utils/auth';
import { parseFrontmatter } from '../utils/frontmatter';
import { validateFileExtension } from '../utils/validation';
import { ERRORS, TIPS } from '../utils/constants';

interface CreateOptions {
  name?: string;
  description?: string;
  tags?: string;
}

export async function createCommand(file: string, options: CreateOptions): Promise<void> {
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
    let name = options.name || parsed.metadata.name;
    let description = options.description || parsed.metadata.description;
    let tags = options.tags
      ? options.tags.split(',').map(t => t.trim())
      : (parsed.metadata.tags || []);

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

    console.log(chalk.green('\n✓ Prompt metadata prepared:'));
    console.log(chalk.cyan(`  Name: ${name}`));
    console.log(chalk.cyan(`  Description: ${description}`));
    if (tags.length > 0) {
      console.log(chalk.cyan(`  Tags: ${tags.join(', ')}`));
    }
    console.log(chalk.dim(`  Content: ${parsed.content.length} characters`));

    console.log(chalk.yellow(`\n${TIPS.PUSH(file)}`));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
