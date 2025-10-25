# Contributing to Gitizi CLI 🐈‍⬛

First off, thank you for considering contributing to Gitizi CLI! It's people like you that make this tool better for everyone.

## Code of Conduct

Be respectful, inclusive, and considerate. We're all here to build something great together.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior** vs **actual behavior**
- **Environment details** (OS, Node.js version, npm version)
- **Error messages or screenshots** if applicable

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Run `izi ...`
2. See error

**Expected behavior**
What you expected to happen.

**Environment:**
 - OS: [e.g., macOS 14.0]
 - Node.js: [e.g., 18.16.0]
 - gitizi-cli: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **Clear use case** - Why would this feature be useful?
- **Proposed solution** - How should it work?
- **Alternative solutions** - What other approaches did you consider?

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## Development Setup

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### Setup Steps

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/gitizi-cli.git
cd gitizi-cli

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Link locally for testing
npm link

# 5. Test the CLI
izi --version
izi --help
```

### Project Structure

```
gitizi-cli/
├── src/
│   ├── commands/      # Command implementations
│   │   ├── auth.ts
│   │   ├── search.ts
│   │   ├── create.ts
│   │   ├── push.ts
│   │   └── clone.ts
│   ├── utils/         # Shared utilities
│   │   ├── api.ts     # API client
│   │   ├── config.ts  # Config management
│   │   └── cat.ts     # ASCII art
│   └── index.ts       # Main entry point
├── examples/          # Example prompts
├── dist/              # Compiled output (gitignored)
└── tests/             # Test files (future)
```

## Development Workflow

### Making Changes

```bash
# Create a new branch
git checkout -b feature/my-feature

# Make your changes to src/ files

# Build and test
npm run build
izi your-command --test

# Run in dev mode (with ts-node)
npm run dev -- auth --help
```

### Testing Changes

```bash
# Build
npm run build

# Link locally
npm link

# Test your changes
izi <your-command>

# Unlink when done
npm unlink -g gitizi-cli
```

## Coding Standards

### TypeScript Style

- Use **TypeScript** for all new code
- Follow existing code patterns
- Use **meaningful variable names**
- Add **type annotations** where helpful
- Avoid `any` types when possible

### Code Organization

```typescript
// Good: Clear, typed, descriptive
interface AuthOptions {
  token?: string;
}

export async function authCommand(options: AuthOptions): Promise<void> {
  // Implementation
}

// Bad: Unclear, untyped
export async function auth(opts: any) {
  // Implementation
}
```

### Comments

- Add JSDoc comments for public functions
- Explain **why**, not **what** (code should be self-explanatory)
- Update comments when code changes

```typescript
/**
 * Authenticates the user with gitizi.com API
 * Stores the token securely in user config
 * 
 * @param options - Authentication options
 * @param options.token - Optional API token
 */
export async function authCommand(options: AuthOptions): Promise<void> {
  // ...
}
```

### Error Handling

- Always handle errors gracefully
- Provide helpful error messages
- Use chalk colors: red for errors, yellow for warnings

```typescript
try {
  await api.authenticate(token);
} catch (error: any) {
  console.error(chalk.red(`❌ Authentication failed: ${error.message}`));
  console.log(chalk.yellow('\nTip: Get your token from https://gitizi.com/settings/tokens'));
  process.exit(1);
}
```

## Commit Messages

Follow conventional commits:

- `feat: Add list command`
- `fix: Handle network timeout errors`
- `docs: Update README installation steps`
- `refactor: Simplify API client`
- `test: Add auth command tests`
- `chore: Update dependencies`

### Examples

```bash
# Good commits
git commit -m "feat: Add prompt versioning support"
git commit -m "fix: Handle empty search results"
git commit -m "docs: Add troubleshooting section"

# Bad commits
git commit -m "update stuff"
git commit -m "fixes"
git commit -m "WIP"
```

## Adding New Commands

To add a new command:

### 1. Create command file

`src/commands/mycommand.ts`:

```typescript
import chalk from 'chalk';
import { getToken } from '../utils/config';

interface MyCommandOptions {
  // Define options
}

export async function myCommand(options: MyCommandOptions): Promise<void> {
  try {
    // Check auth
    const token = getToken();
    if (!token) {
      console.error(chalk.red('❌ Not authenticated. Run: izi auth'));
      process.exit(1);
    }

    // Command logic here
    console.log(chalk.green('✓ Success!'));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
```

### 2. Register in index.ts

```typescript
import { myCommand } from './commands/mycommand';

program
  .command('mycommand')
  .description('Description of my command')
  .option('-f, --flag', 'Some flag')
  .action(myCommand);
```

### 3. Update documentation

- Add to README.md
- Update CHANGELOG.md
- Add examples

## Testing

Currently, the project doesn't have automated tests. Contributing a test suite would be a great addition!

### Future Test Structure

```bash
src/
  commands/
    __tests__/
      auth.test.ts
      search.test.ts
```

### Running Tests (when implemented)

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Documentation

When adding features:

1. **Update README.md** with new commands
2. **Add to CHANGELOG.md** under [Unreleased]
3. **Include examples** in command help text
4. **Update TypeScript docs** (JSDoc comments)

## Questions?

- Open an issue with the "question" label
- Email: support@gitizi.com
- Check existing issues and discussions

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Appreciated by the community! 🎉

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Gitizi CLI! 🐈‍⬛💙
