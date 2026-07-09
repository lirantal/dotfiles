#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required before bootstrapping these dotfiles."
  echo "Install it from https://brew.sh/, then run this script again."
  exit 1
fi

HOMEBREW_BUNDLE_NO_UPGRADE=1 brew bundle install --file "$SOURCE_DIR/Brewfile"

if command -v fnm >/dev/null 2>&1; then
  fnm install 24
  fnm default 24
  eval "$(fnm env --shell bash --log-level quiet)"
  fnm use --silent-if-unchanged 24
fi

chezmoi apply

cat <<'MESSAGE'

Dotfiles applied.

Optional follow-up:
  npm install --global npq-hero

That installs the npm wrapper used by the zsh npm alias.
MESSAGE
