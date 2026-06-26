# Interactive tool integrations.

if [[ ! -t 1 ]]; then
  return
fi

ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#f5c2e7,bold"
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh

# fzf setup:
[ -f "$HOME/.fzf.zsh" ] && source "$HOME/.fzf.zsh"

eval "$(fnm env --use-on-cd --shell zsh)"

# bun completions
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

# Smart directory jumping.
if (( $+commands[zoxide] )); then
  eval "$(zoxide init zsh)"
fi

# Searchable shell history.
if (( $+commands[atuin] )); then
  eval "$(atuin init zsh)"
fi

eval "$(starship init zsh)"

# Keep syntax highlighting near the end so it can wrap widgets defined above.
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
