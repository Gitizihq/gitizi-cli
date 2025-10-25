# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- List command to show user's prompts
- Delete command to remove prompts
- Fork command to duplicate prompts
- Star/favorite functionality
- Interactive mode with menus

## [1.0.0] - 2024-10-26

### Added
- Initial release of Gitizi CLI
- Authentication with gitizi.com using API tokens
- Search functionality to find prompts from the community
- Create command to validate prompt markdown files
- Push command to upload and update prompts
- Clone command to download existing prompts
- Colorful terminal UI with ASCII cat mascot
- Configuration management with persistent token storage
- Support for markdown prompts with YAML frontmatter
- Comprehensive error handling and user feedback
- Example prompts included
- Full documentation (README, setup guide, quick start)

### Features
- `izi auth` - Authenticate with gitizi.com
- `izi search <query>` - Search for prompts
- `izi create <file>` - Create and validate prompts
- `izi push <file>` - Upload prompts to gitizi.com
- `izi clone <id>` - Download existing prompts
- `izi --help` - Display help information
- `izi --version` - Display version information

### Dependencies
- axios: ^1.12.2 - HTTP client for API requests
- chalk: ^4.1.2 - Terminal string styling
- commander: ^14.0.2 - CLI framework
- conf: ^10.2.0 - Configuration management
- inquirer: ^12.10.0 - Interactive command line prompts
- ora: ^5.4.1 - Elegant terminal spinners

[Unreleased]: https://github.com/gitizi/gitizi-cli/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/gitizi/gitizi-cli/releases/tag/v1.0.0
