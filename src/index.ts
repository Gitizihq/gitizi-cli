#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { authCommand } from './commands/auth';
import { searchCommand } from './commands/search';
import { createCommand } from './commands/create';
import { pushCommand } from './commands/push';
import { cloneCommand } from './commands/clone';
import { logoutCommand } from './commands/logout';
import { whoamiCommand } from './commands/whoami';
import { configCommand } from './commands/config';
import { listCommand } from './commands/list';
import { catAscii } from './utils/cat';
import { version } from '../package.json';

const program = new Command();

console.log(chalk.cyan(catAscii));
console.log(chalk.bold.cyan('Gitizi CLI - Your friendly prompt manager\n'));

program
  .name('izi')
  .description('CLI tool for managing prompts on gitizi.com')
  .version(version);

program
  .command('auth')
  .description('Authenticate with gitizi.com')
  .option('-t, --token <token>', 'API token')
  .action(authCommand);

program
  .command('search')
  .description('Search prompts on gitizi.com')
  .argument('<query>', 'Search query')
  .option('-l, --limit <number>', 'Limit results', '10')
  .action(searchCommand);

program
  .command('create')
  .description('Create a new prompt from markdown file')
  .argument('<file>', 'Markdown file path')
  .option('-n, --name <name>', 'Prompt name')
  .option('-d, --description <description>', 'Prompt description')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(createCommand);

program
  .command('push')
  .description('Push a prompt to gitizi.com')
  .argument('<file>', 'Markdown file path')
  .option('--id <id>', 'Prompt ID (for updates)')
  .action(pushCommand);

program
  .command('clone')
  .description('Clone an existing prompt')
  .argument('<prompt-id>', 'Prompt ID to clone')
  .option('-o, --output <path>', 'Output file path', './prompt.md')
  .action(cloneCommand);

program
  .command('list')
  .description('List your prompts')
  .option('-l, --limit <number>', 'Limit results', '10')
  .action(listCommand);

program
  .command('logout')
  .description('Clear stored credentials')
  .action(logoutCommand);

program
  .command('whoami')
  .description('Show current user')
  .action(whoamiCommand);

program
  .command('config')
  .description('Manage configuration')
  .argument('<action>', 'Action: get, set, or list')
  .argument('[key]', 'Config key')
  .argument('[value]', 'Config value')
  .action(configCommand);

program.parse();
