import chalk from 'chalk';
import { getApiUrl, setApiUrl, getUsername, getToken } from '../utils/config';

export async function configCommand(
  action: string,
  key?: string,
  value?: string
): Promise<void> {
  try {
    switch (action.toLowerCase()) {
      case 'get':
        if (!key) {
          console.error(chalk.red('Error: Key is required for "get" action'));
          console.log(chalk.dim('Usage: izi config get <key>'));
          process.exit(1);
        }
        handleGet(key);
        break;

      case 'set':
        if (!key || !value) {
          console.error(chalk.red('Error: Key and value are required for "set" action'));
          console.log(chalk.dim('Usage: izi config set <key> <value>'));
          process.exit(1);
        }
        handleSet(key, value);
        break;

      case 'list':
        handleList();
        break;

      default:
        console.error(chalk.red(`Error: Unknown action "${action}"`));
        console.log(chalk.dim('Available actions: get, set, list'));
        process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

function handleGet(key: string): void {
  const normalizedKey = key.toLowerCase().replace(/-/g, '');

  switch (normalizedKey) {
    case 'apiurl':
    case 'url':
      console.log(getApiUrl());
      break;

    case 'username':
      const username = getUsername();
      if (username) {
        console.log(username);
      } else {
        console.log(chalk.dim('(not set)'));
      }
      break;

    case 'token':
      const token = getToken();
      if (token) {
        // Show only first few characters for security
        console.log(`${token.substring(0, 10)}...`);
      } else {
        console.log(chalk.dim('(not set)'));
      }
      break;

    default:
      console.error(chalk.red(`Error: Unknown config key "${key}"`));
      console.log(chalk.dim('Available keys: api-url, username, token'));
      process.exit(1);
  }
}

function handleSet(key: string, value: string): void {
  const normalizedKey = key.toLowerCase().replace(/-/g, '');

  switch (normalizedKey) {
    case 'apiurl':
    case 'url':
      setApiUrl(value);
      console.log(chalk.green(`✓ API URL set to: ${value}`));
      break;

    default:
      console.error(chalk.red(`Error: Cannot set "${key}"`));
      console.log(chalk.dim('Settable keys: api-url'));
      console.log(chalk.dim('Use "izi auth" to set authentication credentials'));
      process.exit(1);
  }
}

function handleList(): void {
  console.log(chalk.bold.cyan('\n⚙️  Configuration:\n'));

  const apiUrl = getApiUrl();
  console.log(chalk.white(`  API URL: ${apiUrl}`));

  const username = getUsername();
  console.log(chalk.white(`  Username: ${username || chalk.dim('(not set)')}`));

  const token = getToken();
  if (token) {
    console.log(chalk.white(`  Token: ${token.substring(0, 10)}...`));
  } else {
    console.log(chalk.white(`  Token: ${chalk.dim('(not set)')}`));
  }

  console.log(chalk.dim('\n💡 Use "izi config get <key>" to view a specific setting'));
  console.log(chalk.dim('💡 Use "izi config set <key> <value>" to change a setting'));
}
