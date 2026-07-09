# dotfiles

Personal terminal setup managed by [chezmoi](https://www.chezmoi.io/).

## Scope

This repo currently manages:

- zsh loader and modular config under `~/.config/zsh`
- Git config and global ignore rules
- GPG agent config for commit signing
- Husky user init for Git hooks that need the `fnm` Node toolchain
- npm config
- Starship prompt under `~/.config/starship.toml` and `~/.config/starship/`
- Ghostty config under `~/.config/ghostty/config`
- Finicky browser routing config
- gh-cp aliases
- Homebrew package list for the terminal stack

It intentionally does not track local/private files such as:

- `~/.config/zsh/env.local.zsh`
- GitHub CLI auth hosts, SSH keys, GPG keys, and npm auth tokens
- shell history, Atuin history, zoxide databases, caches, or generated backups
- Ghostty generated files under `~/.config/ghostty/auto/`

## New Mac Bootstrap

Install Homebrew first:

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install chezmoi:

```sh
brew install chezmoi
```

Initialize this repo:

```sh
chezmoi init https://github.com/lirantal/dotfiles.git
```

Install missing packages and apply the dotfiles:

```sh
~/.local/share/chezmoi/scripts/bootstrap-macos.sh
```

The bootstrap installs Node.js 24 with `fnm` and makes it the default. The
tracked Husky init loads that `fnm` Node before Git hooks run, so Homebrew
`pnpm` does not fall back to an incompatible Homebrew Node runtime.

For signed commits, import your private GPG key separately and add the exported
public key to GitHub. Do not commit GPG secret keys to this repo.

Optional npm wrapper used by the zsh `npm` alias:

```sh
npm install --global npq-hero
```

## Daily Use

Edit a live dotfile, then re-add it to chezmoi:

```sh
chezmoi re-add
```

Preview what chezmoi would change:

```sh
chezmoi diff
```

Apply source changes to the live home directory:

```sh
chezmoi apply
```

Commit and push from the chezmoi source directory:

```sh
chezmoi cd
git status
git add .
git commit -m "Update dotfiles"
git push
```
