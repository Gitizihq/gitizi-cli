import Conf from 'conf';
import { URLS } from './constants';

const config = new Conf({
  projectName: 'gitizi-cli',
});

export const setToken = (token: string): void => {
  config.set('apiToken', token);
};

export const getToken = (): string | undefined => {
  // Check environment variable first
  return process.env.GITIZI_API_TOKEN || (config.get('apiToken') as string | undefined);
};

export const setUsername = (username: string): void => {
  config.set('username', username);
};

export const getUsername = (): string | undefined => {
  return config.get('username') as string | undefined;
};

export const getApiUrl = (): string => {
  // Check environment variable first
  return process.env.GITIZI_API_URL || (config.get('apiUrl') as string) || URLS.BASE_URL;
};

export const setApiUrl = (url: string): void => {
  config.set('apiUrl', url);
};

export const clearConfig = (): void => {
  config.delete('apiToken');
  config.delete('username');
};

export default config;
