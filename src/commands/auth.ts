import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import api from '../utils/api';
import { setToken, setUsername, getToken } from '../utils/config';
import { catHappy } from '../utils/cat';

interface AuthOptions {
  token?: string;
}

export async function authCommand(options: AuthOptions): Promise<void> {
  try {
    let token = options.token;

    // If no token provided, check if already authenticated
    if (!token) {
      const existingToken = getToken();
      if (existingToken) {
        const { useExisting } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useExisting',
            message: 'You are already authenticated. Do you want to re-authenticate?',
            default: false,
          },
        ]);

        if (!useExisting) {
          console.log(chalk.green('✓ Using existing authentication'));
          return;
        }
      }

      // Prompt for token
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Enter your Gitizi API token:',
          validate: (input: string) => {
            if (!input || input.trim() === '') {
              return 'Token cannot be empty';
            }
            return true;
          },
        },
      ]);
      token = answers.token;
    }

    const spinner = ora('Authenticating with gitizi.com...').start();

    try {
      const result = await api.authenticate(token!);
      
      setToken(token!);
      setUsername(result.username);

      spinner.succeed(chalk.green('Authentication successful!'));
      console.log(chalk.cyan(catHappy));
      console.log(chalk.bold(`Welcome, ${chalk.cyan(result.username)}! 🎉`));
      console.log(chalk.dim('\nYour token has been saved securely.'));
    } catch (error: any) {
      spinner.fail(chalk.red('Authentication failed'));
      console.error(chalk.red(`Error: ${error.message}`));
      console.log(chalk.yellow('\nTo get your API token:'));
      console.log(chalk.dim('1. Visit https://gitizi.com/settings/tokens'));
      console.log(chalk.dim('2. Generate a new token'));
      console.log(chalk.dim('3. Run: izi auth --token YOUR_TOKEN'));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
