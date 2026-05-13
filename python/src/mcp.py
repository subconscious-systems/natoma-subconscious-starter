"""Discover Natoma MCPs from environment variables and load their tools."""
import os
import re
from typing import Any

from langchain_mcp_adapters.client import MultiServerMCPClient


NATOMA_ENV_PATTERN = re.compile(r"^NATOMA_MCP_(.+)_(URL|KEY)$")


def _parse_mcp_env() -> tuple[dict[str, str], dict[str, str]]:
    """Return ({name: url}, {name: key}) parsed from NATOMA_MCP_*_URL/_KEY env vars."""
    urls: dict[str, str] = {}
    keys: dict[str, str] = {}

    for env_name, value in os.environ.items():
        if not value:
            continue
        match = NATOMA_ENV_PATTERN.match(env_name)
        if not match:
            continue

        name = match.group(1).lower()
        kind = match.group(2)
        (urls if kind == "URL" else keys)[name] = value

    return urls, keys


def _build_auth_header(token: str) -> dict[str, str]:
    name = os.environ.get("NATOMA_AUTH_HEADER", "Authorization")
    scheme = os.environ.get("NATOMA_AUTH_SCHEME", "Bearer")
    value = f"{scheme} {token}" if scheme else token
    return {name: value}


def _discover_servers() -> dict[str, dict[str, Any]]:
    urls, keys = _parse_mcp_env()
    servers: dict[str, dict[str, Any]] = {}

    for name, url in urls.items():
        if name not in keys:
            print(f"  ! skipping MCP '{name}': missing NATOMA_MCP_{name.upper()}_KEY")
            continue
        servers[name] = {
            "transport": "streamable_http",
            "url": url,
            "headers": _build_auth_header(keys[name]),
        }

    return servers


async def load_mcp_tools():
    """Return (client, tools). The client is kept alive for the agent's lifetime."""
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
