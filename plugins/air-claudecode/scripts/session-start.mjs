#!/usr/bin/env node

/**
 * SessionStart hook:
 * 1. Injects agent catalog into Claude's context.
 * 2. Checks for air-claudecode updates (cached, daily).
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || join(__dirname, "..");
const AGENTS_DIR = join(PLUGIN_ROOT, "agents");

// --- Version check constants ---
const CACHE_PATH = "/tmp/air-claudecode-update-cache.json";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 3000;
const RAW_PACKAGE_URL =
  "https://raw.githubusercontent.com/sungjinhan-mrt/air-claudecode/main/plugins/air-claudecode/package.json";

// --- Version check functions ---

async function getLocalVersion() {
  try {
    const pkg = JSON.parse(
      await readFile(join(PLUGIN_ROOT, "package.json"), "utf-8"),
    );
    return pkg.version || null;
  } catch {
    return null;
  }
}

function compareSemver(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

async function readCache() {
  try {
    const cache = JSON.parse(await readFile(CACHE_PATH, "utf-8"));
    return cache.checkedAt && cache.remoteVersion ? cache : null;
  } catch {
    return null;
  }
}

async function writeCache(remoteVersion) {
  try {
    await writeFile(
      CACHE_PATH,
      JSON.stringify({ remoteVersion, checkedAt: Date.now() }),
      "utf-8",
    );
  } catch {
    // non-fatal
  }
}

async function fetchRemoteVersion() {
  try {
    const res = await fetch(RAW_PACKAGE_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const pkg = await res.json();
    return pkg.version || null;
  } catch {
    return null;
  }
}

function formatUpdateMessage(local, remote) {
  return [
    `[air-claudecode] 새 버전이 있습니다: v${local} → v${remote}`,
    "업데이트: `/plugin marketplace update air-claudecode` && `/plugin update air-claudecode`",
  ].join("\n");
}

async function checkForUpdate() {
  const localVersion = await getLocalVersion();
  if (!localVersion) return null;

  const cache = await readCache();
  if (cache && Date.now() - cache.checkedAt < CACHE_TTL_MS) {
    return compareSemver(cache.remoteVersion, localVersion) > 0
      ? formatUpdateMessage(localVersion, cache.remoteVersion)
      : null;
  }

  const remoteVersion = await fetchRemoteVersion();
  if (!remoteVersion) return null;

  await writeCache(remoteVersion);

  return compareSemver(remoteVersion, localVersion) > 0
    ? formatUpdateMessage(localVersion, remoteVersion)
    : null;
}

// --- Stdin / Frontmatter helpers ---

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString();
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      meta[key] = val;
    }
  }
  return meta;
}

async function loadAgents() {
  try {
    const files = await readdir(AGENTS_DIR);
    const agents = [];
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = await readFile(join(AGENTS_DIR, file), "utf-8");
      const meta = parseFrontmatter(content);
      if (meta.name) {
        agents.push({
          name: meta.name,
          description: meta.description || "",
          model: meta.model || "sonnet",
        });
      }
    }
    return agents;
  } catch {
    return [];
  }
}

async function main() {
  await readStdin();

  const [agents, updateMessage] = await Promise.all([
    loadAgents(),
    checkForUpdate(),
  ]);

  const parts = [];

  if (agents.length > 0) {
    const catalog = agents
      .map((a) => `- **${a.name}** (${a.model}): ${a.description}`)
      .join("\n");

    parts.push(`# air-claudecode Agents

The following agents are available via air-claudecode. To delegate to an agent, use:

\`\`\`
Task(
  subagent_type="general-purpose",
  prompt="[Read the agent prompt at \${CLAUDE_PLUGIN_ROOT}/agents/{agent-name}.md and follow it exactly]\\n\\nTask: {user's request}"
)
\`\`\`

Or read the agent file directly with Read tool and embed its content in the Task prompt.

Available agents:
${catalog}

Agent prompts are located at: ${AGENTS_DIR}/`);
  }

  if (updateMessage) {
    parts.push(updateMessage);
  }

  if (parts.length === 0) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  console.log(JSON.stringify({ continue: true, message: parts.join("\n\n") }));
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
});
