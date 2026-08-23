# @limelink/mcp

[![npm version](https://img.shields.io/npm/v/%40limelink%2Fmcp.svg)](https://www.npmjs.com/package/@limelink/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[한국어](./README.ko.md) · [Documentation](https://github.com/hellovelop/limelink-mcp-server/blob/main/docs/README.md) · [Capability reference](https://github.com/hellovelop/limelink-mcp-server/blob/main/docs/capabilities/README.md)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [LimeLink](https://limelink.org) dynamic link management. Create, look up, and manage dynamic links directly from Claude Code, Claude Desktop, or any MCP-compatible client.

> **No API key required to get started!** Documentation and SDK setup guides work without any configuration. Just connect and start exploring LimeLink features with your AI assistant.

## Features

- **Documentation Resources** — Access LimeLink docs (15 pages + index) directly from your AI assistant — **no API key needed**
- **5 Tools** — Discover profiles and Projects, create dynamic links, and look up links (API tools require a configured profile)
- **In-memory Caching** — 1-hour TTL cache for documentation fetches

### Runtime

- Node.js 18 or later
- stdio transport only; Remote MCP/HTTP transport is not supported
- npm package: `@limelink/mcp`; global executable: `limelink-mcp`
- stdout is reserved for the MCP protocol; diagnostics and wrapper logs must use stderr

See [installation and configuration](https://github.com/hellovelop/limelink-mcp-server/blob/main/docs/operations/CONFIGURATION.md) and [network behavior](https://github.com/hellovelop/limelink-mcp-server/blob/main/docs/operations/NETWORK_BEHAVIOR.md) for the complete operational contract.

### What works without an API key?

| Feature | Category | API Key | Description |
|---------|----------|:-------:|-------------|
| `limelink://docs/index` | Resource | Not needed | Full documentation index |
| `limelink://docs/{slug}` | Resource | Not needed | 15 individual documentation pages |
| `list-profiles` | Tool | Not needed | List locally configured profile aliases without contacting the API |
| `list-projects` | Tool | **Required** | List Projects for a selected Organization profile |
| `list-custom-domains` | Tool | **Required** | List Custom Domains for a selected Project |
| `create-link` | Tool | **Required** | Create V2 Core Links via API |
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
      "args": ["-y", "@limelink/mcp"]
    }
  }
}
```

Try asking your AI assistant:
- "Read the LimeLink getting-started docs"
- "How do I set up deep linking for iOS?"
- "Show me the LimeLink SDK integration guide"

### With Organization Profiles (Full Features)

Create the version 1 profile file shown below and pass its absolute path:

```json
{
  "mcpServers": {
    "limelink": {
      "command": "npx",
      "args": ["-y", "@limelink/mcp"],
      "env": {
        "LIMELINK_PROFILES_FILE": "/absolute/path/to/limelink-profiles.json"
      }
    }
  }
}
```

### Usage with Global Install

```bash
npm install -g @limelink/mcp
```

```json
{
  "mcpServers": {
    "limelink": {
      "command": "limelink-mcp",
      "env": {
        "LIMELINK_PROFILES_FILE": "/absolute/path/to/limelink-profiles.json"
      }
    }
  }
}
```

## Configuration

### Claude Code

The easiest way to add the MCP server is using the `claude mcp add` command:

```bash
# Without API key (docs & guides only)
claude mcp add --scope user --transport stdio limelink -- npx -y @limelink/mcp

# With API key (full features)
claude mcp add --scope user --transport stdio limelink \
  --env LIMELINK_PROFILES_FILE=/absolute/path/to/limelink-profiles.json \
  -- npx -y @limelink/mcp
```

**Scope options:**
- `--scope user` — Available in all projects
- `--scope project` — Saved to `.mcp.json` (shareable with team via Git)

### Claude Desktop & other MCP clients

Add the JSON config to your client's config file:

| Client | Config File |
|--------|-------------|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |

### Profile file

```json
{"version":1,"defaultProfile":"work","profiles":{"work":{"apiKey":"your_api_key","organizationLabel":"Work","projects":{"marketing":"11111111-1111-4111-8111-111111111111"}}}}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LIMELINK_PROFILES_FILE` | No | — | Path to a version 1 JSON file containing named Organization credential profiles. |

`LIMELINK_API_KEY` and `LIMELINK_PROJECT_ID` are ignored. When no credential profile is configured, API-backed tools direct the agent to [Organizations](https://limelink.org/organizations) to issue an Organization API key and configure the profile file. Project-backed tools accept a Project UUID directly. A profile's optional `projects` map is a recommended convenience for repeatedly used Projects, not a prerequisite; add aliases after `list-projects` discovery if useful. Profiles initialize lazily through credential introspection on their first API-backed call. Profile-file changes, including alias additions, require an MCP server restart.

> You can get your API key from the [LimeLink Dashboard](https://limelink.org/dashboard). Without an API key, documentation resources and SDK setup guides are fully available.

## Tools

### `list-profiles`

Lists configured aliases, Organization labels, default status, and current initialization status without contacting the API. Already initialized profiles include scopes. API key values remain secret and are never returned. Organization, Project, Custom Domain and credential identifiers and key prefixes are non-secret identifiers and may appear in API-backed tool responses when useful.

### `list-projects`

Lists Projects in the Organization discovered from the selected profile's credential. Accepts optional `profile`; the credential requires `projects:read`.

### `list-custom-domains`

Lists Custom Domains for required `project` (alias or UUID). Accepts optional `profile`; the credential requires `domains:read`.

### `create-link`

Create a V2 Core Link with platform-specific deep linking, Custom Domain selection, social previews, and UTM tracking.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dynamic_link_suffix` | string | No | Short URL path identifier (1–100); API-generated when omitted |
| `dynamic_link_url` | string | Yes | Target URL (max 500) |
| `dynamic_link_name` | string | Yes | Link name (max 100) |
| `project` | string | Yes | Project alias in the selected profile or Project UUID |
| `profile` | string | No | Profile alias; otherwise uses configured default or sole profile |
| `custom_domain_id` | UUID string | No | Custom Domain for the Core Link |
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
| `project` | string | Yes | Project alias in the selected profile or Project UUID |
| `profile` | string | No | Profile alias; otherwise uses configured default or sole profile |

### `get-link-by-url`

Resolve a Link through the V2 API using its full URL. The backend determines whether the URL belongs to a Free default namespace, Project hostname, or active Custom Domain. No Project selector or local suffix parsing is required.

The URL must be absolute HTTPS with exactly one `/{suffix}` path segment and no query, fragment, explicit port, or credentials.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Full LimeLink URL to resolve (max 2048 characters) |
| `profile` | string | No | Profile alias; otherwise uses configured default or sole profile |

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
LIMELINK_PROFILES_FILE=/absolute/path/to/limelink-profiles.json node dist/index.js
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
└── resources/
    └── documentation.ts  # Documentation resources
```

## License

MIT
