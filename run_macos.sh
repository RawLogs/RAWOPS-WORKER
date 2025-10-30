#!/usr/bin/env bash

set -euo pipefail

# Move to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting RAWOPS-WORKER..."

# Auto-update via git
if command -v git >/dev/null 2>&1; then
  echo "Checking for updates..."
  git fetch origin || true
  local_rev=$(git rev-parse HEAD 2>/dev/null || echo "")
  remote_rev=$(git rev-parse '@{u}' 2>/dev/null || echo "")
  if [[ -n "$local_rev" && -n "$remote_rev" && "$local_rev" != "$remote_rev" ]]; then
    echo "New version available. Updating..."
    current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    git reset --hard "origin/$current_branch" || true
    git pull || true
    echo "Update complete."
  else
    echo "Already up to date."
  fi
fi

# Check Node.js
if command -v node >/dev/null 2>&1; then
  echo "Node.js is installed: $(node --version)"
else
  echo "================================================"
  echo "Node.js is not installed!"
  echo "================================================"
  echo "Please install Node.js LTS to continue: https://nodejs.org/"
  exit 1
fi

# Check pnpm
if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm version: $(pnpm --version)"
else
  read -r -p "pnpm is not installed. Install it now using npm? (y/n) " install_pnpm
  if [[ "$install_pnpm" == "y" || "$install_pnpm" == "Y" ]]; then
    npm install -g pnpm
  else
    echo "Please install pnpm to continue: npm install -g pnpm"
    exit 1
  fi
fi

# Dependencies
read -r -p "Neu cai worker roi thi nhap Y, chua thi N? (y/n) " has_installed
if [[ "$has_installed" == "y" || "$has_installed" == "Y" ]]; then
  echo "Skipping pnpm install."
else
  echo "Installing dependencies with pnpm..."
  pnpm install
fi

# .env.local handling
ENV_FILE=".env.local"
needs_api_key=false

if [[ -f "$ENV_FILE" ]]; then
  api_key_line=$(grep -E '^\s*API_KEY\s*=' "$ENV_FILE" || true)
  if [[ -n "$api_key_line" ]]; then
    api_value=${api_key_line#*=}
    api_value=$(echo "$api_value" | xargs)
    if [[ -z "$api_value" || "$api_value" == "..." || "$api_value" == "your_api_key_here" || "$api_value" == "your_api_key_from_website" ]]; then
      echo "API_KEY is invalid: '$api_value'"
      needs_api_key=true
    fi
  else
    needs_api_key=true
  fi
else
  echo "Creating .env.local file..."
  cat > "$ENV_FILE" <<'EOF'
WEB_API_URL=https://rawops.net/api
API_KEY=your_api_key_here
EOF
  needs_api_key=true
fi

if [[ "$needs_api_key" == true ]]; then
  echo ""
  echo "================================================"
  echo "API_KEY is missing or invalid!"
  echo "================================================"
  echo "Get your API key from: https://rawops.net/"
  read -r -p "Enter your API_KEY: " API_KEY_INPUT
  if [[ -z "$API_KEY_INPUT" ]]; then
    echo "API_KEY is required!"
    exit 1
  fi
  if grep -qE '^\s*API_KEY\s*=' "$ENV_FILE"; then
    sed -i.bak -E "s#^\s*API_KEY\s*=.*#API_KEY=$API_KEY_INPUT#g" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  else
    echo "API_KEY=$API_KEY_INPUT" >> "$ENV_FILE"
  fi
  echo "✅ API_KEY saved to $ENV_FILE"
fi

# Ensure WEB_API_URL exists
if ! grep -qE '^\s*WEB_API_URL\s*=' "$ENV_FILE"; then
  echo "Adding WEB_API_URL to .env.local..."
  echo "WEB_API_URL=https://rawops.net/api" >> "$ENV_FILE"
  echo "✅ WEB_API_URL added"
fi

echo ""
echo "Starting RAWOPS-WORKER worker..."
echo ""
pnpm start
exit_code=$?

if [[ $exit_code -ne 0 ]]; then
  echo ""
  echo "Application exited with error code: $exit_code"
  exit $exit_code
fi

echo ""
echo "Application closed."


