/**
 * Discover MCP servers from environment variables and load their tools.
 *
 * Two env-var patterns are supported:
 *
 *   Natoma-managed MCPs (proxied through natoma.app):
 *     NATOMA_MCP_<NAME>_URL / NATOMA_MCP_<NAME>_KEY
 *
 *   Direct MCP servers (connect to the service's own MCP endpoint):
 *     MCP_<NAME>_URL / MCP_<NAME>_KEY
 *
 * Both use streamable-HTTP transport. Direct MCPs send the key as a
 * standard "Authorization: Bearer <key>" header.
 */
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const NATOMA_ENV_PATTERN = /^NATOMA_MCP_(.+)_(URL|KEY)$/;
const DIRECT_ENV_PATTERN = /^MCP_(.+)_(URL|KEY)$/;

type HttpServerConfig = {
  transport: "http";
  url: string;
  headers: Record<string, string>;
};

function scanEnv(pattern: RegExp): {
  urls: Record<string, string>;
  keys: Record<string, string>;
} {
  const urls: Record<string, string> = {};
  const keys: Record<string, string> = {};

  for (const [envName, value] of Object.entries(process.env)) {
    if (!value) continue;
    const match = envName.match(pattern);
    if (!match) continue;
    const [, rawName, kind] = match;
    const name = rawName.toLowerCase();
    if (kind === "URL") urls[name] = value;
    else keys[name] = value;
  }

  return { urls, keys };
}

function buildNatomaAuthHeader(token: string): Record<string, string> {
  const name = process.env.NATOMA_AUTH_HEADER ?? "Authorization";
  const scheme = process.env.NATOMA_AUTH_SCHEME ?? "Bearer";
  return { [name]: scheme ? `${scheme} ${token}` : token };
}

function discoverServers(): Record<string, HttpServerConfig> {
  const servers: Record<string, HttpServerConfig> = {};

  // --- Natoma-managed MCPs ---
  const natoma = scanEnv(NATOMA_ENV_PATTERN);
  for (const [name, url] of Object.entries(natoma.urls)) {
    if (!natoma.keys[name]) {
      console.log(
        `  ! skipping natoma MCP '${name}': missing NATOMA_MCP_${name.toUpperCase()}_KEY`,
      );
      continue;
    }
    servers[`natoma:${name}`] = {
      transport: "http",
      url,
      headers: buildNatomaAuthHeader(natoma.keys[name]),
    };
  }

  // --- Direct MCP servers ---
  const direct = scanEnv(DIRECT_ENV_PATTERN);
  for (const [name, url] of Object.entries(direct.urls)) {
    if (!direct.keys[name]) {
      console.log(
        `  ! skipping MCP '${name}': missing MCP_${name.toUpperCase()}_KEY`,
      );
      continue;
    }
    servers[name] = {
      transport: "http",
      url,
      headers: { Authorization: `Bearer ${direct.keys[name]}` },
    };
  }

  return servers;
}

export async function loadMcpTools() {
  const servers = discoverServers();
  const names = Object.keys(servers).sort();

  if (names.length === 0) {
    console.log(
      "  ! no MCPs configured — add MCP_<NAME>_URL/_KEY " +
        "pairs to .env to give the agent tools.",
    );
    return { client: null, tools: [] as any[] };
  }

  console.log(`  discovered ${names.length} MCP(s): ${names.join(", ")}`);
  const client = new MultiServerMCPClient({ mcpServers: servers });
  const tools = await client.getTools();
  console.log(`  loaded ${tools.length} tool(s)`);
  return { client, tools };
}
