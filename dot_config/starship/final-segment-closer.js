#!/usr/bin/env node

const fs = require("fs");
const { spawnSync } = require("child_process");

const mode = process.argv[2];

function inGitRepo() {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    stdio: "ignore",
  });

  return result.status === 0;
}

function hasAny(names, kind) {
  return names.some((name) => {
    try {
      const stat = fs.statSync(name);
      return kind === "directory" ? stat.isDirectory() : stat.isFile();
    } catch {
      return false;
    }
  });
}

function hasNodeSignal() {
  if (
    hasAny(
      [
        "package.json",
        ".node-version",
        ".nvmrc",
        "pnpm-lock.yaml",
        "package-lock.json",
        "npm-shrinkwrap.json",
      ],
      "file"
    ) ||
    hasAny(["node_modules"], "directory")
  ) {
    return true;
  }

  const nodeFilePattern = /\.(?:js|mjs|cjs|ts|mts|cts)$/;
  try {
    return fs.readdirSync(".").some((entry) => {
      try {
        return fs.statSync(entry).isFile() && nodeFilePattern.test(entry);
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

const git = inGitRepo();
const node = hasNodeSignal();

if ((mode === "git" && git && !node) || (mode === "directory" && !git && !node)) {
  process.stdout.write("");
}
