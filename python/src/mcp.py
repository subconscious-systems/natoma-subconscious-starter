"""Discover Natoma MCPs from environment variables and load their tools."""
import os
from typing import Any

from langchain_mcp_adapters.client import MultiServerMCPClient


def _discover_servers() -> dict[str, dict[str, Any]]:
    auth_header = os.environ.get("NATOMA_AUTH_HEADER", "Authorization")
    auth_scheme = os.environ.get("NATOMA_AUTH_SCHEME", "Bearer")

    urls: dict[str, str] = {}
    keys: dict[str, str] = {}
    for env_name, value in os.environ.items():
        if not env_name.startswith("NATOMA_MCP_") or not value:
            continue
        if env_name.endswith("_URL"):
            name = env_name[len("NATOMA_MCP_"):-len("_URL")].lower()
            urls[name] = value
        elif env_name.endswith("_KEY"):
            name = env_name[len("NATOMA_MCP_"):-len("_KEY")].lower()
            keys[name] = value

    servers: dict[str, dict[str, Any]] = {}
    for name, url in urls.items():
        if name not in keys:
            print(f"  ! skipping MCP '{name}': missing NATOMA_MCP_{name.upper()}_KEY")
            continue
        token = f"{auth_scheme} {keys[name]}".strip() if auth_scheme else keys[name]
        servers[name] = {
            "transport": "streamable_http",
            "url": url,
            "headers": {auth_header: token},
        }
    return servers


async def load_mcp_tools():
    """Return (client, tools). Client kept alive for the agent's lifetime."""
    servers = _discover_servers()
    if not servers:
        print(
            "  ! no Natoma MCPs configured — add NATOMA_MCP_<NAME>_URL/_KEY "
            "pairs to .env to give the agent tools."
        )
        return None, []

    print(f"  discovered {len(servers)} MCP(s): {', '.join(sorted(servers))}")
    client = MultiServerMCPClient(servers)
    tools = await client.get_tools()
    print(f"  loaded {len(tools)} tool(s)")
    return client, tools
