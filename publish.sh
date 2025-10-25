#!/bin/bash

# 🚀 Gitizi CLI - Automated Publishing Script
# This script helps you publish gitizi-cli to npm step by step

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}"
echo "    /\_/\\  "
echo "   ( ^.^ ) "
echo "    > ♥ <  "
echo -e "${NC}"
echo -e "${CYAN}🚀 Gitizi CLI - Publishing Wizard${NC}"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the gitizi-cli directory"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ git $(git --version | cut -d' ' -f3)${NC}"

echo ""
echo -e "${YELLOW}This wizard will help you:${NC}"
echo "  1. Set up your GitHub repository"
echo "  2. Configure package.json"
echo "  3. Publish to npm"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════${NC}"
echo -e "${CYAN}Step 1: GitHub Setup${NC}"
echo -e "${CYAN}═══════════════════════════════════${NC}"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo -e "${RED}GitHub username required${NC}"
    exit 1
fi

# Update package.json with GitHub info
echo -e "${BLUE}Updating package.json...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.repository.url = 'git+https://github.com/$GITHUB_USER/gitizi-cli.git';
pkg.bugs.url = 'https://github.com/$GITHUB_USER/gitizi-cli/issues';
pkg.homepage = 'https://github.com/$GITHUB_USER/gitizi-cli#readme';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✓ package.json updated');
"

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo -e "${BLUE}Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit: Gitizi CLI v1.0.0 🐈‍⬛"
    echo -e "${GREEN}✓ Git initialized${NC}"
else
    echo -e "${YELLOW}⚠ Git already initialized${NC}"
fi

echo ""
echo -e "${YELLOW}Next steps for GitHub:${NC}"
echo "  1. Go to: ${BLUE}https://github.com/new${NC}"
echo "  2. Repository name: ${CYAN}gitizi-cli${NC}"
echo "  3. Keep it ${GREEN}public${NC}"
echo "  4. Don't initialize with README"
echo ""
echo "  Then run these commands:"
echo -e "  ${CYAN}git remote add origin https://github.com/$GITHUB_USER/gitizi-cli.git${NC}"
echo -e "  ${CYAN}git branch -M main${NC}"
echo -e "  ${CYAN}git push -u origin main${NC}"
echo ""

read -p "Have you created the GitHub repo and pushed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}No problem! Run this script again when ready.${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════${NC}"
echo -e "${CYAN}Step 2: Build & Test${NC}"
echo -e "${CYAN}═══════════════════════════════════${NC}"
echo ""

# Clean and build
echo -e "${BLUE}Cleaning previous build...${NC}"
rm -rf dist

echo -e "${BLUE}Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Check dist
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    echo -e "${RED}❌ dist/index.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ dist/index.js exists${NC}"

# Test locally
echo ""
echo -e "${BLUE}Testing locally...${NC}"
npm link > /dev/null 2>&1
if izi --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CLI works locally${NC}"
    izi --version
else
    echo -e "${RED}❌ CLI test failed${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════${NC}"
echo -e "${CYAN}Step 3: npm Publishing${NC}"
echo -e "${CYAN}═══════════════════════════════════${NC}"
echo ""

# Check npm login
if npm whoami > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Logged in to npm as: $(npm whoami)${NC}"
else
    echo -e "${YELLOW}You need to login to npm${NC}"
    echo "If you don't have an account, create one at: https://www.npmjs.com/signup"
    echo ""
    npm login
fi

echo ""
echo -e "${YELLOW}About to publish:${NC}"
echo -e "  Package: ${CYAN}gitizi-cli${NC}"
echo -e "  Version: ${CYAN}1.0.0${NC}"
echo -e "  Registry: ${CYAN}https://registry.npmjs.org${NC}"
echo ""

# Show what will be published
echo -e "${BLUE}Files to be published:${NC}"
npm pack --dry-run 2>&1 | grep -E "^\d" | head -20

echo ""
read -p "Ready to publish to npm? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Publication cancelled${NC}"
    exit 0
fi

# Publish!
echo ""
echo -e "${BLUE}Publishing to npm...${NC}"
npm publish

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 SUCCESS!${NC}"
    echo -e "${GREEN}═══════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}    /\_/\\  "
    echo -e "   ( ^.^ ) "
    echo -e "    > ♥ <  ${NC}"
    echo ""
    echo -e "${GREEN}✓ Published to npm successfully!${NC}"
    echo ""
    echo "View your package: ${BLUE}https://www.npmjs.com/package/gitizi-cli${NC}"
    echo ""
    echo "Anyone can now install with:"
    echo -e "  ${CYAN}npm install -g gitizi-cli${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Create a GitHub release: https://github.com/$GITHUB_USER/gitizi-cli/releases/new"
    echo "     - Tag: v1.0.0"
    echo "     - Title: v1.0.0 - Initial Release 🐈‍⬛"
    echo ""
    echo "  2. Share on social media!"
    echo "  3. Add badges to your README"
    echo "  4. Link from gitizi.com"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Publication failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  • Package name already taken → use @yourname/gitizi-cli"
    echo "  • Not logged in → run: npm login"
    echo "  • Email not verified → check your npm email"
    echo ""
    exit 1
fi

# Cleanup
npm unlink -g gitizi-cli > /dev/null 2>&1

echo ""
echo -e "${CYAN}Happy publishing! 🚀${NC}"
