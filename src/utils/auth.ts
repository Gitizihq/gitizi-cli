import chalk from 'chalk';
import { getToken } from './config';
import { ERRORS } from './constants';

/**
 * Requires authentication and returns the token
 * Exits the process if not authenticated
 * @returns The authentication token
 */
export function requireAuth(): string {
  const token = getToken();
  if (!token) {
    console.error(chalk.red(ERRORS.NOT_AUTHENTICATED));
    process.exit(1);
  }
  return token;
}

/**
 * Checks if the user is authenticated
 * @returns True if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}
