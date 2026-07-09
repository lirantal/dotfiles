# Load the same Node toolchain for non-interactive Git hooks that zsh uses
# interactively. Husky sources this file before running repository hooks.

if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --shell bash --log-level quiet)"

  if fnm use --silent-if-unchanged 24 >/dev/null 2>&1; then
    :
  else
    fnm use --silent-if-unchanged default >/dev/null 2>&1 || true
  fi
fi

if [ -x /opt/homebrew/bin/pnpm ] && command -v node >/dev/null 2>&1; then
  husky_toolchain_dir="${XDG_STATE_HOME:-$HOME/.local/state}/husky-toolchain/bin"

  if mkdir -p "$husky_toolchain_dir"; then
    node_path="$(command -v node)"
    ln -sf "$node_path" "$husky_toolchain_dir/node"
    ln -sf /opt/homebrew/bin/pnpm "$husky_toolchain_dir/pnpm"
    ln -sf /opt/homebrew/bin/pnpm "$husky_toolchain_dir/pnpx"

    export PATH="$husky_toolchain_dir:$PATH"
  fi
fi
