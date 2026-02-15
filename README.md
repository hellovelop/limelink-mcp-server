# limelink-mcp-server

[![npm version](https://img.shields.io/npm/v/limelink-mcp-server.svg)](https://www.npmjs.com/package/limelink-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[한국어](./README.ko.md)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [LimeLink](https://limelink.org) dynamic link management. Create, look up, and manage dynamic links directly from Claude Code, Claude Desktop, or any MCP-compatible client.

> **No API key required to get started!** Documentation, SDK setup guides, and prompt templates work without any configuration. Just connect and start exploring LimeLink features with your AI assistant.

## Features

- **Documentation Resources** — Access LimeLink docs (15 pages + index) directly from your AI assistant — **no API key needed**
- **2 Prompt Templates** — Guided workflows for link creation and SDK deep linking setup — **no API key needed**
- **3 Tools** — Create dynamic links, look up by suffix, look up by URL (requires API key)
- **In-memory Caching** — 1-hour TTL cache for documentation fetches

### What works without an API key?

| Feature | Category | API Key | Description |
|---------|----------|:-------:|-------------|
| `limelink://docs/index` | Resource | Not needed | Full documentation index |
| `limelink://docs/{slug}` | Resource | Not needed | 15 individual documentation pages |
| `setup-deep-linking` | Prompt | Not needed | iOS/Android SDK setup guide |
| `create-dynamic-link` | Prompt | Not needed | Link creation guide (uses `create-link` tool to execute) |
| `create-link` | Tool | **Required** | Create dynamic links via API |
| `get-link-by-suffix` | Tool | **Required** | Look up links by suffix |
| `get-link-by-url` | Tool | **Required** | Look up links by URL |

## Quick Start

### Without API Key (Documentation & Guides)

No API key needed. Connect and start exploring LimeLink documentation and setup guides immediately:

```json
{
  "mcpServers": {
    "limelink": {
      "command": "npx",
      "args": ["-y", "limelink-mcp-server"]
    }
  }
}
```

Try asking your AI assistant:
- "Read the LimeLink getting-started docs"
- "How do I set up deep linking for iOS?"
- "Show me the LimeLink SDK integration guide"

### With API Key (Full Features)

Add your API key to unlock link creation and management tools:

```json
{
  "mcpServers": {
    "limelink": {
      "command": "npx",
      "args": ["-y", "limelink-mcp-server"],
      "env": {
        "LIMELINK_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Usage with Global Install

```bash
npm install -g limelink-mcp-server
```

```json
{
  "mcpServers": {
    "limelink": {
      "command": "limelink-mcp-server",
      "env": {
        "LIMELINK_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Configuration

### Where to add the config

| Client | Config File |
|--------|-------------|
| Claude Code (global) | `~/.claude/settings.json` |
| Claude Code (project) | `.claude/settings.local.json` |
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LIMELINK_API_KEY` | No | — | API key for link management tools. Documentation resources and prompt templates work without it. |
| `LIMELINK_PROJECT_ID` | No | — | Default project ID (used when not specified in tool calls) |

> You can get your API key from the [LimeLink Dashboard](https://limelink.org/dashboard). Without an API key, documentation resources, SDK setup guides, and prompt templates are fully available.

## Tools

### `create-link`

Create a dynamic link with platform-specific deep linking, social previews, and UTM tracking.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dynamic_link_suffix` | string | Yes | Short URL path identifier (max 50) |
| `dynamic_link_url` | string | Yes | Target URL (max 500) |
| `dynamic_link_name` | string | Yes | Link name (max 100) |
| `project_id` | string | No | Project ID (falls back to env) |
| `stats_flag` | boolean | No | Enable analytics tracking |
| `apple_options` | object | No | iOS deep linking options |
| `android_options` | object | No | Android deep linking options |
| `additional_options` | object | No | Social preview + UTM options |

**Example usage in Claude:**

> "Create a dynamic link for https://example.com/product/123 with suffix 'product-123' and enable analytics"

### `get-link-by-suffix`

Look up a dynamic link by its suffix.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suffix` | string | Yes | Dynamic link suffix |
| `project_id` | string | No | Project ID (falls back to env) |

### `get-link-by-url`

Look up a dynamic link by its full URL. Automatically extracts the suffix from both URL formats:

- **Free plan:** `https://deep.limelink.org/{suffix}`
- **Pro plan:** `https://{project}.limelink.org/link/{suffix}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Full LimeLink dynamic link URL |
| `project_id` | string | No | Project ID (falls back to env) |

## Resources

### `limelink://docs/index`

Returns the full LimeLink documentation index (`llms.txt`).

### `limelink://docs/{slug}`

Returns individual documentation pages. Available slugs:

`introduction`, `getting-started`, `project`, `application`, `dynamic-link`, `create-link`, `link-detail`, `link-management`, `appearance`, `sdk-integration`, `ios-sdk`, `android-sdk`, `api-integration`, `advanced`, `llm-agent`

**Example usage in Claude:**

> "Read the LimeLink API integration docs"
>
> Claude will access `limelink://docs/api-integration`

## Prompts

### `create-dynamic-link`

Guided workflow for creating a dynamic link.

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `target_url` | string | Yes | Destination URL |
| `suffix` | string | No | Custom suffix |
| `platforms` | enum | Yes | `ios`, `android`, `both`, or `web` |

### `setup-deep-linking`

Guided workflow for setting up LimeLink SDK deep linking.

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `platform` | enum | Yes | `ios`, `android`, or `both` |

## Development

### Prerequisites

- Node.js >= 18
- pnpm

### Setup

```bash
git clone https://github.com/hellovelop/limelink-mcp-server.git
cd limelink-mcp-server
pnpm install
pnpm run build
```

### Run locally

```bash
LIMELINK_API_KEY=your_key node dist/index.js
```

### Testing

```bash
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests (MCP stdio communication)
pnpm test:watch    # Unit tests in watch mode
pnpm test:coverage # Coverage report
```

### Project Structure

```
src/
├── index.ts              # Entry point
├── lib/
│   ├── config.ts         # Environment variable loading
│   ├── cache.ts          # In-memory TTL cache
│   ├── api-client.ts     # LimeLink API HTTP client
│   └── doc-fetcher.ts    # Documentation fetcher with caching
├── tools/
│   ├── create-link.ts    # create-link tool
│   ├── get-link-by-suffix.ts
│   └── get-link-by-url.ts
├── resources/
│   └── documentation.ts  # Documentation resources
└── prompts/
    ├── create-link-prompt.ts
    └── deep-link-prompt.ts
```

## License

MIT
