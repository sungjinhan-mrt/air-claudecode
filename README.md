# air-claudecode

**Lightweight skill-sharing plugin for Claude Code teams. Zero dependencies, zero config.**

---

## Requirements

| Tool                                                          | Required            | Description                                                                                         |
|---------------------------------------------------------------|---------------------|-----------------------------------------------------------------------------------------------------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Yes                 | Anthropic's official CLI for Claude                                                                 |
| [GitHub CLI (gh)](https://cli.github.com/)                    | Yes                 | GitHub command-line tool ([Installation Guide](docs/install-guide/gh-installation-guide.md))        |
| [git-flow-next](https://github.com/gittower/git-flow-next)   | For Git Flow        | Modern Git Flow CLI ([Installation Guide](docs/install-guide/git-flow-installation-guide.md))       |
| [MCP Atlassian](https://github.com/sooperset/mcp-atlassian)  | For Jira/Confluence | Atlassian MCP server ([Installation Guide](docs/install-guide/mcp-atlassian-installation-guide.md)) |
| [Slack MCP](https://github.com/modelcontextprotocol/servers)  | For Slack           | Slack MCP server ([Installation Guide](docs/install-guide/slack-mcp-installation-guide.md))         |
| [gogcli](https://github.com/steipete/gogcli)                 | For Google Calendar | Google Workspace CLI ([Installation Guide](docs/install-guide/gogcli-installation-guide.md))        |

---

## Installation

### 1. Add marketplace

In Claude Code, run:

```
/plugin marketplace add https://github.com/myrealtrip/air-claudecode
```

### 2. Install the plugin

```
/plugin install air-claudecode
```

### 3. Verify installation

```
/air-claudecode:setup-air-cc
```

This checks all prerequisites, offers to install missing tools, sets up the CLAUDE.md block, and reports status.

### 4. Start using

```
/air-claudecode:git-commit
/air-claudecode:jira-master
```

---

## Update

### Update to the latest version

```
/plugin marketplace update air-claudecode
/plugin update air-claudecode
```

### Reinstall (if update fails)

```
/plugin uninstall air-claudecode
/plugin install air-claudecode
```

---

## Project Conventions

Team-specific development conventions in [`conventions/project-conventions/`](plugins/air-claudecode/conventions/project-conventions/).

---

## Docs

- [GitHub CLI Installation Guide](docs/install-guide/gh-installation-guide.md)
- [git-flow-next Installation Guide](docs/install-guide/git-flow-installation-guide.md)
- [MCP Atlassian Installation Guide](docs/install-guide/mcp-atlassian-installation-guide.md)
- [Slack MCP Installation Guide](docs/install-guide/slack-mcp-installation-guide.md)
- [gogcli Installation Guide](docs/install-guide/gogcli-installation-guide.md)

---

## Authors

- **YoungKwang Kim** - [@gykk16](https://github.com/gykk16)
- **SungHoon Lee** - [@hooniis](https://github.com/hooniis)
