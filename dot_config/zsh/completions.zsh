# Completion setup. Build fpath first, then run compinit once.

if (( $+commands[brew] )); then
  brew_prefix="${HOMEBREW_PREFIX:-$(brew --prefix)}"
  fpath=(
    # Homebrew-managed zsh completions, including pnpm's _pnpm.
    "$brew_prefix/share/zsh/site-functions"
    "$brew_prefix/share/zsh-completions"
    $fpath
  )
  unset brew_prefix
fi

if [[ -d "$HOME/.zsh/completion" ]]; then
  fpath=("$HOME/.zsh/completion" $fpath)
fi

autoload -Uz compinit
compinit -i

zstyle ':completion:*:*:docker:*' option-stacking yes
zstyle ':completion:*:*:docker-*:*' option-stacking yes

if [[ -f "${ZSH_CONFIG_DIR:-$HOME/.config/zsh}/npm-completion.zsh" ]]; then
  source "${ZSH_CONFIG_DIR:-$HOME/.config/zsh}/npm-completion.zsh"
fi
