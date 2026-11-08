#!/usr/bin/env python3
"""Arrange Ghostty-only workspaces. Invoked by AeroSpace on-window-detected."""
import fcntl
import json
import os
from pathlib import Path
import shutil
import shlex
import subprocess
import sys
import time

APP = 'com.mitchellh.ghostty'
BINARY = os.environ.get('AEROSPACE_BIN') or shutil.which('aerospace')


def run(*args):
    return subprocess.check_output([BINARY, *map(str, args)], text=True).strip()


def windows(scope):
    text = run('list-windows', *scope, '--format',
               '%{window-id}|%{app-bundle-id}|%{workspace}|%{window-layout}')
    return [line.split('|') for line in text.splitlines() if line]


def arrange():
    target = os.environ.get('AEROSPACE_WINDOW_ID')
    if len(sys.argv) == 3 and sys.argv[1] == '--window-id':
        target = sys.argv[2]
    if not target:
        focused = windows(['--focused'])
        target = focused[0][0] if focused else None
    # Detection can fire before the window is exposed through list-windows.
    match = None
    for _ in range(20):
        match = next((w for w in windows(['--all']) if w[0] == target), None)
        if match:
            break
        time.sleep(0.1)
    if not match or match[1] != APP or match[3] == 'floating':
        return
    workspace = match[2]
    rows = [w for w in windows(['--workspace', workspace]) if w[3] != 'floating']
    # Flattening a mixed workspace would disturb other applications.
    if not rows or any(w[1] != APP for w in rows):
        return
    live = {w[0] for w in rows}
    try:
        saved = json.loads((STATE / 'order.json').read_text())
    except (FileNotFoundError, ValueError):
        saved = []
    # Preserve creation order across layout changes/workspace moves. Existing
    # windows on first use are seeded by macOS window ID (best available proxy).
    ordered = [wid for wid in saved if wid in live]
    ordered += sorted(live - set(ordered), key=int)
    count = len(ordered)
    desired = ordered[:]
    if count >= 5:
        desired[:4] = [ordered[0], ordered[2], ordered[1], ordered[3]]

    # Flatten preserves DFS order. Plan all mutations before sending one eval
    # request, avoiding CLI round trips and visible intermediate layout requests.
    commands = []

    def queue(*args):
        commands.append(shlex.join(map(str, args)))

    queue('flatten-workspace-tree', '--workspace', workspace)
    queue('layout', '--workspace', workspace, '--root', 'h_tiles')
    current = [w[0] for w in rows]
    for index, wid in enumerate(desired):
        position = current.index(wid)
        for _ in range(position - index):
            queue('move', '--window-id', wid, 'left')
        current.pop(position)
        current.insert(index, wid)

    if count in (3, 4):
        queue('layout', '--workspace', workspace, '--root', 'v_tiles')
        queue('join-with', '--window-id', desired[0], 'down')
        if count == 4:
            queue('join-with', '--window-id', desired[2], 'down')
    elif count >= 5:
        for index in range(0, count - 1, 2):
            queue('join-with', '--window-id', desired[index], 'right')
    queue('balance-sizes', '--workspace', workspace)
    # Stop the batch on failure (e.g. a window closes during planning).
    run('eval', ' && '.join(commands))
    # Keep IDs in other workspaces, too, so moving a window preserves its age.
    all_live = {w[0] for w in windows(['--all']) if w[1] == APP}
    saved = [wid for wid in saved if wid in all_live]
    saved += [wid for wid in ordered if wid not in saved]
    (STATE / 'order.json').write_text(json.dumps(saved) + '\n')


if __name__ == '__main__':
    if not BINARY:
        sys.exit('ghostty-layout: aerospace is not on PATH')
    STATE = Path(os.environ.get('XDG_CACHE_HOME', str(Path.home() / '.cache'))) / 'aerospace-ghostty-layout'
    STATE.mkdir(parents=True, exist_ok=True, mode=0o700)
    # Serializes rapid callbacks; a process exit automatically releases the lock.
    with (STATE / 'lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            arrange()
        except subprocess.CalledProcessError as error:
            sys.exit(f'ghostty-layout: AeroSpace command failed: {error.cmd}')
