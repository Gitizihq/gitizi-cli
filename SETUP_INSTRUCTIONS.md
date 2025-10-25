# Gitizi CLI - Setup Instructions for Claude Code

## 🚀 Quick Setup Guide

Copy and paste these commands into **Claude Code CLI** to set up and install the Gitizi CLI tool:

### 1. Navigate to the Project Directory

```bash
cd /home/claude/gitizi-cli
```

### 2. Install the CLI Globally (for development)

```bash
npm link
```

This will make the `izi` command available globally on your system.

### 3. Test the Installation

```bash
izi --version
izi --help
```

You should see the cat mascot and the available commands!

---

## 📦 Alternative Installation Methods

### Install from npm (once published)

```bash
npm install -g gitizi-cli
```

### Use directly with npx

```bash
npx gitizi-cli <command>
```

---

## 🎯 Usage Examples

### 1. Authenticate with Gitizi.com

```bash
izi auth
# Or provide token directly:
izi auth --token YOUR_API_TOKEN
```

Get your API token from: https://gitizi.com/settings/tokens

### 2. Search for Prompts

```bash
izi search "code review"
izi search "typescript" --limit 20
izi search "machine learning" --limit 5
```

### 3. Clone an Existing Prompt

```bash
izi clone abc123
izi clone abc123 -o my-custom-prompt.md
izi clone xyz789 --output ./prompts/ai-assistant.md
```

### 4. Create and Validate a Prompt

First, create a markdown file with frontmatter:

```bash
cat > my-prompt.md << 'EOF'
---
name: TypeScript Expert
description: An expert TypeScript developer assistant
tags: [typescript, programming, debugging]
---

You are an expert TypeScript developer with deep knowledge of:
- Type systems and advanced TypeScript features
- Best practices and design patterns
- Performance optimization
- Testing strategies

When helping with code:
1. Explain your reasoning
2. Provide type-safe solutions
3. Consider edge cases
4. Follow TypeScript best practices
EOF
```

Then validate it:

```bash
izi create my-prompt.md
```

### 5. Push Your Prompt to Gitizi.com

```bash
izi push my-prompt.md
```

Update an existing prompt:

```bash
izi push my-prompt.md --id abc123
```

---

## 🏗️ Development Commands

### Build the Project

```bash
cd /home/claude/gitizi-cli
npm run build
```

### Run in Development Mode

```bash
npm run dev -- auth
npm run dev -- search "test"
```

### Clean and Rebuild

```bash
rm -rf dist node_modules
npm install --break-system-packages
npm run build
npm link
```

---

## 📝 Project Structure

```
gitizi-cli/
├── src/
│   ├── commands/          # Command implementations
│   │   ├── auth.ts        # Authentication command
│   │   ├── search.ts      # Search prompts
│   │   ├── create.ts      # Create prompt
│   │   ├── push.ts        # Push prompt
│   │   └── clone.ts       # Clone prompt
│   ├── utils/             # Utility functions
│   │   ├── api.ts         # API client for gitizi.com
│   │   ├── config.ts      # Configuration management
│   │   └── cat.ts         # ASCII cat mascot
│   └── index.ts           # Main CLI entry point
├── examples/              # Example prompt files
│   └── code-review.md     # Example prompt
├── dist/                  # Compiled JavaScript (generated)
├── package.json           # NPM configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Documentation
```

---

## 🐈‍⬛ Features Implemented

✅ **Authentication** - Secure token-based auth with gitizi.com  
✅ **Search Prompts** - Find prompts from the community  
✅ **Create Prompts** - Create from markdown with frontmatter  
✅ **Push Prompts** - Upload and update prompts  
✅ **Clone Prompts** - Download existing prompts to edit  
✅ **Colorful Output** - Beautiful terminal UI with cat mascot  
✅ **Configuration** - Persistent config storage  
✅ **Error Handling** - Clear error messages and guidance  

---

## 🔧 Configuration

Config is stored in:
- **Linux/Mac:** `~/.config/gitizi-cli/config.json`
- **Windows:** `%APPDATA%\gitizi-cli\config.json`

View config location:
```bash
node -e "console.log(require('conf').prototype.path)"
```

---

## 🎨 Prompt Format

Prompts use markdown with YAML frontmatter:

```markdown
---
name: Prompt Name
description: Brief description
tags: [tag1, tag2, tag3]
---

Your actual prompt content here...

Can include multiple paragraphs, code blocks, etc.
```

---

## 🐞 Troubleshooting

### Command not found: izi

```bash
npm link
# or
npm install -g gitizi-cli
```

### Permission denied

```bash
sudo npm link
# or use npm prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Module not found errors

```bash
cd /home/claude/gitizi-cli
rm -rf node_modules package-lock.json
npm install --break-system-packages
npm run build
```

---

## 📚 API Integration Notes

The CLI is configured to work with `https://gitizi.com/api` by default.

Expected API endpoints:
- `POST /auth/verify` - Verify auth token
- `GET /prompts/search` - Search prompts
- `GET /prompts/:id` - Get specific prompt
- `POST /prompts` - Create new prompt
- `PUT /prompts/:id` - Update existing prompt

You'll need to implement these endpoints on the gitizi.com backend or update the API client in `src/utils/api.ts` to match your actual API structure.

---

## 🚀 Next Steps

1. **Test the CLI locally**
   ```bash
   npm link && izi --help
   ```

2. **Implement the backend API** at gitizi.com

3. **Publish to npm**
   ```bash
   npm publish
   ```

4. **Add more features**:
   - `izi list` - List your prompts
   - `izi delete <id>` - Delete a prompt
   - `izi edit <id>` - Edit prompt in $EDITOR
   - `izi fork <id>` - Fork someone's prompt
   - `izi star <id>` - Star a prompt

---

## 📄 License

MIT

---

Made with 💙 by the Gitizi team 🐈‍⬛
