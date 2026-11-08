# Ghostty window placement

The live config stays at `~/.aerospace.toml`. Its Ghostty-only
`on-window-detected` callback runs `~/.config/aerospace/scripts/ghostty-layout.py`.
Requires AeroSpace 0.21.3 or compatible, Python 3, and both container normalization
options enabled (as in the config). No third-party Python packages are needed.

Windows are counted **per workspace**, excluding floating windows:

```text
1: [1]           2: [1 | 2]

3: [1 | 2]       4: [1 | 2]
   [  3  ]          [3 | 4]

5: [1 | 2 |   ]  6: [1 | 2 | 5]
   [3 | 4 | 5 ]     [3 | 4 | 6]

7: [1 | 2 | 5 |   ]
   [3 | 4 | 6 | 7 ]
```

Each additional column starts full-height and is split top/bottom by the next
window. At four windows this is a **2 by 2** grid. Sizes are balanced on each
new window. The first four retain their positions when later columns are added.

The script rebuilds the layout when a Ghostty window is detected, preserving
focus. Mutations are planned in advance and sent in one `aerospace eval` batch;
already ordered windows incur no reorder moves. There is no fixed startup delay
(the script retries briefly only if a detected window is not queryable yet).
The initial native window appearance may still be visible before the callback
finishes; the batch reduces intermediate redraws rather than guaranteeing an
atomic macOS screen update. Floating windows are untouched. Workspaces containing other tiled apps
are skipped, so their layouts are preserved. Closing/moving a window does not
trigger a rebuild; the next new window rebuilds from the remaining windows.

Creation order is cached under
`${XDG_CACHE_HOME:-~/.cache}/aerospace-ghostty-layout/` (not tracked by chezmoi).
The initial order of pre-existing windows is seeded by numeric macOS window ID.
Callbacks are serialized with an OS file lock, automatically released on exit.

To manually rebuild a Ghostty workspace, focus a Ghostty window and run:

```sh
PATH=/opt/homebrew/bin:/usr/local/bin:$PATH python3 ~/.config/aerospace/scripts/ghostty-layout.py
```

To track further edits:

```sh
chezmoi add ~/.aerospace.toml ~/.config/aerospace/scripts/ghostty-layout.py ~/.config/aerospace/README.md
```

To disable, remove the Ghostty entry from `on-window-detected` and run
`aerospace reload-config`. Other application routing rules are independent.
