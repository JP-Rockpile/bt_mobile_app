#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node 22 (latest LTS for Expo SDK 54)
nvm use 22

# Verify Node version
echo "Using Node version: $(node --version)"

# Start the app
pnpm start

