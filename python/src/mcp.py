"""Discover MCP servers from environment variables and load their tools.

Two env-var patterns are supported:

  Natoma-managed MCPs (proxied through natoma.app):
    NATOMA_MCP_<NAME>_URL / NATOMA_MCP_<NAME>_KEY

  Direct MCP servers (connect to the service's own MCP endpoint):
    MCP_<NAME>_URL / MCP_<NAME>_KEY

Both use streamable-HTTP transport. Direct MCPs send the key as a
standard "Authorization: Bearer <key>" header.
"""
import os
import re
from typing import Any

from langchain_mcp_adapters.client import MultiServerMCPClient


NATOMA_ENV_PATTERN = re.compile(r"^NATOMA_MCP_(.+)_(URL|KEY)$")
DIRECT_ENV_PATTERN = re.compile(r"^MCP_(.+)_(URL|KEY)$")


def _scan_env(pattern: re.Pattern) -> tuple[dict[str, str], dict[str, str]]:
    """Return ({name: url}, {name: key}) for env vars matching *pattern*."""
    urls: dict[str, str] = {}
    keys: dict[str, str] = {}

    for env_name, value in os.environ.items():
        if not value:
            continue
        match = pattern.match(env_name)
        if not match:
            continue

        name = match.group(1).lower()
        kind = match.group(2)
        (urls if kind == "URL" else keys)[name] = value

    return urls, keys


def _natoma_auth_header(token: str) -> dict[str, str]:
    name = os.environ.get("NATOMA_AUTH_HEADER", "Authorization")
    scheme = os.environ.get("NATOMA_AUTH_SCHEME", "Bearer")
    value = f"{scheme} {token}" if scheme else token
    return {name: value}


def _discover_servers() -> dict[str, dict[str, Any]]:
    servers: dict[str, dict[str, Any]] = {}

    # --- Natoma-managed MCPs ---
    natoma_urls, natoma_keys = _scan_env(NATOMA_ENV_PATTERN)
    for name, url in natoma_urls.items():
        if name not in natoma_keys:
            print(f"  ! skipping natoma MCP '{name}': missing NATOMA_MCP_{name.upper()}_KEY")
            continue
        servers[f"natoma:{name}"] = {
            "transport": "streamable_http",
            "url": url,
            "headers": _natoma_auth_header(natoma_keys[name]),
        }

    # --- Direct MCP servers ---
    direct_urls, direct_keys = _scan_env(DIRECT_ENV_PATTERN)
    for name, url in direct_urls.items():
        if name not in direct_keys:
            print(f"  ! skipping MCP '{name}': missing MCP_{name.upper()}_KEY")
            continue
        servers[name] = {
            "transport": "streamable_http",
            "url": url,
            "headers": {"Authorization": f"Bearer {direct_keys[name]}"},
        }

    return servers


async def load_mcp_tools():
    """Return (client, tools). The client is kept alive for the agent's lifetime."""
    servers = _discover_servers()
    if not servers:
        print(
            "  ! no MCPs configured — add MCP_<NAME>_URL/_KEY pairs to .env "
            "to give the agent tools."
        )
        return None, []

    print(f"  discovered {len(servers)} MCP(s): {', '.join(sorted(servers))}")
    client = MultiServerMCPClient(servers)
    tools = await client.get_tools()
    print(f"  loaded {len(tools)} tool(s)")
    return client, tools
