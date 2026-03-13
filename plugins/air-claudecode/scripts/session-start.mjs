#!/usr/bin/env node

/**
 * SessionStart hook:
 * Injects agent catalog into Claude's context.
 */

import {readdir, readFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || join(__dirname, "..");
const AGENTS_DIR = join(PLUGIN_ROOT, "agents");

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
      meta[key] = line.slice(idx + 1).trim();
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

  const agents = await loadAgents();

  if (agents.length === 0) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  const catalog = agents
    .map((a) => `- **${a.name}** (${a.model}): ${a.description}`)
    .join("\n");

  const message = `# air-claudecode Agents

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

Agent prompts are located at: ${AGENTS_DIR}/`;

  console.log(JSON.stringify({ continue: true, message }));
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
});
