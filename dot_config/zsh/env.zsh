# Environment and PATH setup.

export LANG=en_US.UTF-8
# Default Editor setup
# Example for using VS Code instead as the default editor:
# export EDITOR="code --wait"
export EDITOR="vim"

# Match the prompt palette loosely for eza file and metadata colors.
export EZA_COLORS="\
di=1;38;2;245;194;231:\
ln=38;2;148;226;213:\
ex=38;2;166;227;161:\
ur=38;2;166;227;161:gr=38;2;166;227;161:tr=38;2;166;227;161:\
uw=38;2;249;226;175:gw=38;2;249;226;175:tw=38;2;249;226;175:\
ux=38;2;250;179;135:gx=38;2;250;179;135:tx=38;2;250;179;135:\
ue=38;2;250;179;135:su=38;2;250;179;135:sf=38;2;250;179;135:\
xx=38;2;108;112;134:\
uu=38;2;180;190;254:uR=38;2;250;179;135:un=38;2;203;166;247:\
gu=38;2;245;194;231:gR=38;2;250;179;135:gn=38;2;203;166;247:\
sn=38;2;148;226;213:sb=38;2;148;226;213:\
lc=38;2;203;166;247:lm=38;2;203;166;247:\
da=38;2;137;180;250:\
hd=1;38;2;180;190;254:\
ga=38;2;166;227;161:gm=38;2;249;226;175:gd=38;2;250;179;135:\
gv=38;2;148;226;213:gt=38;2;203;166;247:gi=38;2;108;112;134:gc=38;2;243;139;168:\
*.js=38;2;249;226;175:\
*.ts=38;2;137;180;250:\
*.json=38;2;249;226;175:\
*.md=38;2;180;190;254:\
*.yml=38;2;250;179;135:\
*.yaml=38;2;250;179;135:\
*.toml=38;2;203;166;247:\
*.lock=38;2;166;173;200\
"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# The next line updates PATH for the Google Cloud SDK.
if [ -f "$HOME/tools/google-cloud-sdk/path.zsh.inc" ]; then
  . "$HOME/tools/google-cloud-sdk/path.zsh.inc"
fi

# path for pyenv
PATH="$(pyenv root)/shims:$PATH"
# path for Java
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# opencode
export PATH="$HOME/.opencode/bin:$PATH"

if [[ -n "$TTY" && "$TTY" != "not a tty" ]]; then
  export GPG_TTY="$TTY"
else
  unset GPG_TTY
fi

# Private, machine-local environment. Keep this file out of public dotfiles.
if [[ -f "${ZSH_CONFIG_DIR:-$HOME/.config/zsh}/env.local.zsh" ]]; then
  source "${ZSH_CONFIG_DIR:-$HOME/.config/zsh}/env.local.zsh"
fi
