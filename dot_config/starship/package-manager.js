#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SUPPORTED = new Set(["npm", "pnpm"]);
const ICONS = {
  npm: "",
  pnpm: "󰏗",
};
const CACHE_MAX_AGE_MS = 60 * 60 * 1000;
const CACHE_FILE = path.join(
  os.tmpdir(),
  `starship-package-manager-versions-${typeof process.getuid === "function" ? process.getuid() : "user"}.json`
);

function findUp(start, predicate) {
  let current = path.resolve(start);

  while (true) {
    if (predicate(current)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function normalizePackageManagerSpec(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const match = value.match(/^(npm|pnpm)(?:@(.+))?$/);
    if (!match) {
      return null;
    }

    return { name: match[1], required: match[2] || "" };
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalizePackageManagerSpec(entry);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  if (typeof value === "object") {
    const name = typeof value.name === "string" ? value.name : "";
    if (!SUPPORTED.has(name)) {
      return null;
    }

    return {
      name,
      required: typeof value.version === "string" ? value.version : "",
    };
  }

  return null;
}

function packageManagerFromDevEngines(pkg) {
  return normalizePackageManagerSpec(pkg.devEngines?.packageManager);
}

function packageManagerFromEngines(pkg) {
  const engines = pkg.engines;
  if (!engines || typeof engines !== "object") {
    return null;
  }

  for (const name of Object.keys(engines)) {
    if (SUPPORTED.has(name)) {
      return {
        name,
        required: typeof engines[name] === "string" ? engines[name] : "",
      };
    }
  }

  return null;
}

function packageManagerFromLockfile(start) {
  const root = findLockfileRoot(start);

  if (!root) {
    return null;
  }

  return packageManagerFromLockfileRoot(root);
}

function findLockfileRoot(start) {
  return findUp(start, (dir) => {
    if (dir === os.homedir()) {
      return false;
    }

    return hasPackageManagerLockfile(dir);
  });
}

function hasPackageManagerLockfile(dir) {
  return (
    fs.existsSync(path.join(dir, "pnpm-lock.yaml")) ||
    fs.existsSync(path.join(dir, "package-lock.json")) ||
    fs.existsSync(path.join(dir, "npm-shrinkwrap.json"))
  );
}

function packageManagerFromLockfileRoot(root) {
  if (fs.existsSync(path.join(root, "pnpm-lock.yaml"))) {
    return { name: "pnpm", required: "" };
  }

  return { name: "npm", required: "" };
}

function nearestProjectMarker(start) {
  return findUp(start, (dir) => {
    if (dir === os.homedir()) {
      return false;
    }

    return fs.existsSync(path.join(dir, "package.json")) || hasPackageManagerLockfile(dir);
  });
}

function detectPackageManager(start) {
  const projectRoot = nearestProjectMarker(start);
  if (projectRoot) {
    const packageJson = path.join(projectRoot, "package.json");
    const pkg = fs.existsSync(packageJson) ? readJson(packageJson) : null;
    if (pkg) {
      return (
        packageManagerFromDevEngines(pkg) ||
        packageManagerFromEngines(pkg) ||
        packageManagerFromLockfileRoot(projectRoot) ||
        packageManagerFromLockfile(path.dirname(projectRoot)) ||
        { name: "npm", required: "" }
      );
    }

    return packageManagerFromLockfileRoot(projectRoot);
  }

  return { name: "npm", required: "" };
}

function commandPath(command) {
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    if (!dir) {
      continue;
    }

    const candidate = path.join(dir, command);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // Keep searching PATH.
    }
  }

  return "";
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), "utf8");
  } catch {
    // Prompt rendering should never fail because a cache write failed.
  }
}

function cacheKey(command, binPath) {
  let mtime = "unknown";
  try {
    mtime = String(fs.statSync(binPath).mtimeMs);
  } catch {
    // The binary may disappear between lookup and stat; keep the key stable.
  }

  return `${command}:${binPath}:${mtime}`;
}

function versionFromCommand(binPath) {
  const result = spawnSync(binPath, ["--version"], {
    cwd: os.tmpdir(),
    encoding: "utf8",
    env: {
      ...process.env,
      COREPACK_ENABLE_PROJECT_SPEC: "0",
    },
  });

  if (result.status !== 0) {
    return "";
  }

  const match = result.stdout.trim().match(/\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?/);
  return match ? match[0] : "";
}

function versionFromHomebrewPath(command, binPath) {
  const realPath = (() => {
    try {
      return fs.realpathSync(binPath);
    } catch {
      return binPath;
    }
  })();

  const cellarMatch = realPath.match(new RegExp(`/Cellar/${command}/([^/]+)/`));
  return cellarMatch ? cellarMatch[1] : "";
}

function installedVersion(command) {
  const binPath = commandPath(command);
  if (!binPath) {
    return "missing";
  }

  const cache = readCache();
  const key = cacheKey(command, binPath);
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_MAX_AGE_MS) {
    return cached.version;
  }

  const version = versionFromCommand(binPath) || versionFromHomebrewPath(command, binPath) || "unknown";
  cache[key] = { timestamp: Date.now(), version };
  writeCache(cache);

  return version;
}

const detected = detectPackageManager(process.cwd());
const installed = installedVersion(detected.name);
const required = detected.required ? ` (${detected.required})` : "";

process.stdout.write(`${ICONS[detected.name]} ${detected.name} ${installed}${required}`);
