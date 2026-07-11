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
- portable Codex preferences, enabled plugins, custom skills, and custom pets

It intentionally does not track local/private files such as:

- `~/.config/zsh/env.local.zsh`
- GitHub CLI auth hosts, SSH keys, GPG keys, and npm auth tokens
- shell history, Atuin history, zoxide databases, caches, or generated backups
- Ghostty generated files under `~/.config/ghostty/auto/`
- Codex credentials, conversations, attachments, generated content, caches,
  worktrees, installed plugin caches, and local database state

## Codex: Managing Portable Preferences Without Copying Host State

`~/.codex/config.toml` mixes portable preferences with machine-local and
sensitive state. A direct copy would publish project paths and trust decisions,
marketplace metadata, generated integration settings, application paths, and
possibly secrets added to MCP configuration later.

This repo therefore manages only an explicit allowlist of portable values:

```text
.chezmoitemplates/codex-preferences.toml  # safe, portable desired values
dot_codex/modify_config.toml              # merges them into the live config
dot_codex/skills/                         # selected personal skills only
dot_codex/pets/                           # selected custom pets only
.chezmoiignore                            # credentials/runtime-data guardrails
```

The preferences template contains model defaults, approval and sandbox
preferences, portable MCP servers, enabled plugin declarations, and desktop
preferences. It deliberately excludes `[projects]`, `[marketplaces]`, generated
MCP helpers, notification binary paths, and per-path host settings.

`modify_config.toml` is a chezmoi modify template. Chezmoi passes the existing
host file through `.chezmoi.stdin`; the template parses both TOML documents,
deep-merges the portable preferences over the host configuration, and writes the
result back. Unknown host keys are preserved but never copied into the Git
repository:

```gotemplate
{{- /* chezmoi:modify-template */ -}}
{{- $current := dict -}}
{{- if .chezmoi.stdin -}}
{{-   $current = fromToml .chezmoi.stdin -}}
{{- end -}}
{{- $desired := includeTemplate "codex-preferences.toml" . | fromToml -}}
{{- $merged := mergeOverwrite (deepCopy $current) $desired -}}
{{- $merged | toToml -}}
```

The source file must be named `modify_config.toml`, without a `.tmpl` suffix.
The `chezmoi:modify-template` marker enables template evaluation. `toToml`
normalizes formatting and does not preserve comments, so semantic comparison is
more meaningful than textual formatting when reviewing the first application.

To change a portable Codex preference:

```sh
chezmoi cd
$EDITOR .chezmoitemplates/codex-preferences.toml
chezmoi diff ~/.codex/config.toml
chezmoi apply ~/.codex
```

Do not run `chezmoi re-add ~/.codex/config.toml`: the live file contains the
local data this pattern is designed not to capture. Also note that deleting a
key from `codex-preferences.toml` only stops managing that key; the merge leaves
an existing host value untouched. Remove it from the live file separately, or
use `deleteValueAtPath` in the modify template when deletion must be enforced.

Add new personal assets by naming them explicitly:

```sh
chezmoi add ~/.codex/skills/<skill-name>
chezmoi add ~/.codex/pets/<pet-name>
```

Do not recursively add all of `~/.codex`, and do not use `--exact` for the
skills or pets parent directories. Codex owns system skills and generated
entries alongside personal ones. Marketplace plugin identities and enabled
flags belong in the preferences template; downloaded plugin installations under
`~/.codex/plugins` remain ignored and reproducible.

### Reusing This Pattern for Other Mixed or Sensitive Files

Use the same approach when a single configuration file contains both portable
preferences and secrets, account identifiers, host paths, or generated state:

1. Define a small, reviewed allowlist in `.chezmoitemplates/`; never start by
   committing a redacted copy of the complete live file.
2. Add a `modify_` target that parses `.chezmoi.stdin`, merges the allowlist over
   the existing document, and serializes the result.
3. Put secrets in environment variables, the OS keychain, a password manager,
   or chezmoi-encrypted files rather than in the portable template.
4. Add `.chezmoiignore` rules for adjacent credentials, databases, histories,
   caches, generated output, and installation directories. Ignore rules protect
   files and directories; they cannot filter individual keys inside a file.
5. Manage selected asset directories explicitly and avoid `--exact` wherever
   the application also creates or installs neighboring entries.
6. Before committing, render or apply in dry-run mode, parse the result, confirm
   local-only keys remain on the host, and scan the staged source for known path,
   account, token, and metadata patterns.

The governing rule is to version durable intent, not a snapshot of application
state.

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

The bootstrap installs Node.js 26.5.0 with `fnm` and makes it the default. The
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
