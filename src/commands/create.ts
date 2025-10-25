import chalk from 'chalk';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';
import { getToken } from '../utils/config';

interface CreateOptions {
  name?: string;
  description?: string;
  tags?: string;
}

export async function createCommand(file: string, options: CreateOptions): Promise<void> {
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

    // Parse frontmatter if exists (basic YAML-like parsing)
    let name = options.name;
    let description = options.description;
    let tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      
      if (!name) {
        const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
        if (nameMatch) name = nameMatch[1].trim();
      }
      
      if (!description) {
        const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
        if (descMatch) description = descMatch[1].trim();
      }
      
      if (tags.length === 0) {
        const tagsMatch = frontmatter.match(/^tags:\s*\[(.+)\]$/m);
        if (tagsMatch) {
          tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
        }
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

    console.log(chalk.green('\n✓ Prompt metadata prepared:'));
    console.log(chalk.cyan(`  Name: ${name}`));
    console.log(chalk.cyan(`  Description: ${description}`));
    if (tags.length > 0) {
      console.log(chalk.cyan(`  Tags: ${tags.join(', ')}`));
    }
    console.log(chalk.dim(`  Content: ${content.length} characters`));

    console.log(chalk.yellow('\n💡 Use "izi push ' + file + '" to upload this prompt to gitizi.com'));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
