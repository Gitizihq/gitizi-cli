export const ERRORS = {
  NOT_AUTHENTICATED: '❌ Not authenticated. Please run: izi auth',
  FILE_NOT_FOUND: (file: string) => `❌ File not found: ${file}`,
  AUTHENTICATION_FAILED: 'Authentication failed',
  SEARCH_FAILED: 'Search failed',
  CLONE_FAILED: 'Clone failed',
  PUSH_FAILED: 'Push failed',
  UPDATE_FAILED: 'Update failed',
  TOKEN_EMPTY: 'Token cannot be empty',
  NAME_REQUIRED: 'Name is required',
  DESCRIPTION_REQUIRED: 'Description is required',
  NAME_TOO_LONG: 'Name must be 100 characters or less',
  DESCRIPTION_TOO_LONG: 'Description must be 500 characters or less',
  CONTENT_TOO_LARGE: 'Content must be 100KB or less',
  INVALID_FILE_EXTENSION: (file: string) => `Invalid file extension. Expected .md, got: ${file}`,
};

export const URLS = {
  PROMPTS: (id: string) => `https://gitizi.com/prompts/${id}`,
  TOKEN_SETTINGS: 'https://gitizi.com/settings/tokens',
  BASE_URL: 'https://sewwdxmqorokboxzpsxu.supabase.co/functions/v1',
};

export const MESSAGES = {
  USING_EXISTING_AUTH: '✓ Using existing authentication',
  AUTH_SUCCESS: 'Authentication successful!',
  PROMPT_PUSHED: 'Prompt pushed successfully!',
  PROMPT_UPDATED: 'Prompt updated successfully!',
  PROMPT_CLONED: 'Prompt cloned successfully!',
  WELCOME: (username: string) => `Welcome, ${username}! 🎉`,
  TOKEN_SAVED: '\nYour token has been saved securely.',
  NO_PROMPTS_FOUND: '\nNo prompts found matching your query.',
  REAUTH_PROMPT: 'You are already authenticated. Do you want to re-authenticate?',
};

export const TIPS = {
  CLONE: (id: string) => `💡 Share your prompt or clone it with: izi clone ${id}`,
  PUSH: (file: string) => `💡 Use "izi push ${file}" to upload this prompt to gitizi.com`,
  CLONE_GENERAL: '💡 Tip: Use "izi clone <prompt-id>" to download a prompt',
  PUSH_UPDATE: (output: string, id: string) =>
    `💡 Edit the prompt and push changes with: izi push ${output} --id ${id}`,
  GET_TOKEN: [
    '\nTo get your API token:',
    '1. Visit https://gitizi.com/settings/tokens',
    '2. Generate a new token',
    '3. Run: izi auth --token YOUR_TOKEN',
  ],
};

export const LIMITS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CONTENT_SIZE: 100 * 1024, // 100KB
  MAX_TAG_LENGTH: 30,
  MAX_TAGS_COUNT: 10,
  DEFAULT_SEARCH_LIMIT: 10,
  API_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};
