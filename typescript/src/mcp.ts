import { MultiServerMCPClient } from "@langchain/mcp-adapters";

type ServerConfig = {
  transport: "http";
  url: string;
  headers: Record<string, string>;
};

function discoverServers(): Record<string, ServerConfig> {
  const authHeader = process.env.NATOMA_AUTH_HEADER ?? "Authorization";
  const authScheme = process.env.NATOMA_AUTH_SCHEME ?? "Bearer";

  const urls: Record<string, string> = {};
  const keys: Record<string, string> = {};

  for (const [envName, value] of Object.entries(process.env)) {
    if (!envName.startsWith("NATOMA_MCP_") || !value) continue;
    if (envName.endsWith("_URL")) {
      const name = envName
        .slice("NATOMA_MCP_".length, -"_URL".length)
        .toLowerCase();
      urls[name] = value;
    } else if (envName.endsWith("_KEY")) {
      const name = envName
        .slice("NATOMA_MCP_".length, -"_KEY".length)
        .toLowerCase();
      keys[name] = value;
    }
  }

  const servers: Record<string, ServerConfig> = {};
  for (const [name, url] of Object.entries(urls)) {
    const key = keys[name];
    if (!key) {
      console.log(
        `  ! skipping MCP '${name}': missing NATOMA_MCP_${name.toUpperCase()}_KEY`,
      );
      continue;
    }
    const token = authScheme ? `${authScheme} ${key}` : key;
    servers[name] = {
      transport: "http",
      url,
      headers: { [authHeader]: token },
    };
  }
  return servers;
}

export async function loadMcpTools() {
  const servers = discoverServers();
  const names = Object.keys(servers);
  if (names.length === 0) {
    console.log(
      "  ! no Natoma MCPs configured — add NATOMA_MCP_<NAME>_URL/_KEY " +
        "pairs to .env to give the agent tools.",
    );
    return { client: null, tools: [] };
  }
  console.log(
    `  discovered ${names.length} MCP(s): ${names.sort().join(", ")}`,
  );
  const client = new MultiServerMCPClient(servers);
  const tools = await client.getTools();
  console.log(`  loaded ${tools.length} tool(s)`);
  return { client, tools };
}
