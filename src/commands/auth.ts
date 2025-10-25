import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import api from '../utils/api';
import { setToken, setUsername, getToken } from '../utils/config';
import { catHappy } from '../utils/cat';
import { ERRORS, MESSAGES, TIPS, URLS } from '../utils/constants';

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
            message: MESSAGES.REAUTH_PROMPT,
            default: false,
          },
        ]);

        if (!useExisting) {
          console.log(chalk.green(MESSAGES.USING_EXISTING_AUTH));
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
              return ERRORS.TOKEN_EMPTY;
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

      spinner.succeed(chalk.green(MESSAGES.AUTH_SUCCESS));
      console.log(chalk.cyan(catHappy));
      console.log(chalk.bold(MESSAGES.WELCOME(chalk.cyan(result.username))));
      console.log(chalk.dim(MESSAGES.TOKEN_SAVED));
    } catch (error: any) {
      spinner.fail(chalk.red(ERRORS.AUTHENTICATION_FAILED));
      console.error(chalk.red(`Error: ${error.message}`));
      console.log(chalk.yellow(TIPS.GET_TOKEN[0]));
      console.log(chalk.dim(TIPS.GET_TOKEN[1]));
      console.log(chalk.dim(TIPS.GET_TOKEN[2]));
      console.log(chalk.dim(TIPS.GET_TOKEN[3]));
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
