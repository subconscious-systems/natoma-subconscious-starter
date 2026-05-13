import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const NATOMA_ENV_PATTERN = /^NATOMA_MCP_(.+)_(URL|KEY)$/;

type McpServerConfig = {
  transport: "http";
  url: string;
  headers: Record<string, string>;
};

function parseMcpEnv(): {
  urls: Record<string, string>;
  keys: Record<string, string>;
} {
  const urls: Record<string, string> = {};
  const keys: Record<string, string> = {};

  for (const [envName, value] of Object.entries(process.env)) {
    if (!value) continue;
    const match = envName.match(NATOMA_ENV_PATTERN);
    if (!match) continue;

    const [, rawName, kind] = match;
    const name = rawName.toLowerCase();
    if (kind === "URL") urls[name] = value;
    else keys[name] = value;
  }

  return { urls, keys };
}

function buildAuthHeader(token: string): Record<string, string> {
  const name = process.env.NATOMA_AUTH_HEADER ?? "Authorization";
  const scheme = process.env.NATOMA_AUTH_SCHEME ?? "Bearer";
  return { [name]: scheme ? `${scheme} ${token}` : token };
}

function discoverServers(): Record<string, McpServerConfig> {
  const { urls, keys } = parseMcpEnv();
  const servers: Record<string, McpServerConfig> = {};

  for (const [name, url] of Object.entries(urls)) {
    const token = keys[name];
    if (!token) {
      console.log(
        `  ! skipping MCP '${name}': missing NATOMA_MCP_${name.toUpperCase()}_KEY`,
      );
      continue;
    }
    servers[name] = {
      transport: "http",
      url,
      headers: buildAuthHeader(token),
    };
  }

  return servers;
}

export async function loadMcpTools() {
  const servers = discoverServers();
  const names = Object.keys(servers).sort();

  if (names.length === 0) {
    console.log(
      "  ! no Natoma MCPs configured — add NATOMA_MCP_<NAME>_URL/_KEY " +
        "pairs to .env to give the agent tools.",
    );
    return { client: null, tools: [] };
  }

  console.log(`  discovered ${names.length} MCP(s): ${names.join(", ")}`);
  const client = new MultiServerMCPClient(servers);
  const tools = await client.getTools();
  console.log(`  loaded ${tools.length} tool(s)`);
  return { client, tools };
}
