#!/usr/bin/env bash
set -euo pipefail

# ==========================
# Download ChromeDriver
# ==========================
read -r -p "Da co chromedriver chua? (y/n) " has_chrome
if [[ "$has_chrome" != "y" && "$has_chrome" != "Y" ]]; then
  echo "Checking Google Chrome version..."
  CHROME_VERSION=$(/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version | awk '{print $3}')
  echo "Detected Chrome version: $CHROME_VERSION"

  echo "Checking system architecture..."
  ARCH=$(uname -m)
  echo "Detected architecture: $ARCH"

  # Map architecture for Chrome’s download link
  if [ "$ARCH" = "arm64" ]; then
      ARCH_LABEL="mac-arm64"
  else
      ARCH_LABEL="mac-x64"
  fi

  # Construct download URLs
  DRIVER_URL="https://storage.googleapis.com/chrome-for-testing-public/${CHROME_VERSION}/${ARCH_LABEL}/chromedriver-${ARCH_LABEL}.zip"

  echo "Downloading ChromeDriver from: $DRIVER_URL"
  curl -L -o chromedriver.zip "$DRIVER_URL"

  # Prepare working directory
  mkdir -p chromium
  TMPDIR=$(mktemp -d)

  # Extract into temp folder
  unzip -q chromedriver.zip -d "$TMPDIR"

  # Copy all files into ./chromium
  echo "Copying extracted files into ./chromium..."
  cp -R "$TMPDIR"/*/* chromium/

  # Cleanup temp files
  rm -rf "$TMPDIR" chromedriver.zip

  echo "✅ Chrome and ChromeDriver are ready in ./chromium/"
fi