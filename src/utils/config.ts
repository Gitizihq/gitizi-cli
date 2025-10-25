import Conf from 'conf';

interface GitiziConfig {
  apiToken?: string;
  apiUrl: string;
  username?: string;
}

const config = new Conf<GitiziConfig>({
  projectName: 'gitizi-cli',
  defaults: {
    apiUrl: 'https://gitizi.com/api',
  },
});

export const setToken = (token: string): void => {
  config.set('apiToken', token);
};

export const getToken = (): string | undefined => {
  return config.get('apiToken');
};

export const setUsername = (username: string): void => {
  config.set('username', username);
};

export const getUsername = (): string | undefined => {
  return config.get('username');
};

export const getApiUrl = (): string => {
  return config.get('apiUrl');
};

export const setApiUrl = (url: string): void => {
  config.set('apiUrl', url);
};

export const clearConfig = (): void => {
  config.clear();
};

export default config;
