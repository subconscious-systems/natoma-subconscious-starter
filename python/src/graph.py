"""The agent graph: Subconscious model + Natoma MCP tools, wired by LangChain."""
from langchain.agents import create_agent

from src.mcp import load_mcp_tools
from src.model import build_model


SYSTEM_PROMPT = """You are a helpful agent with access to tools exposed via Natoma MCPs.

When a task requires data or actions in external systems (email, issue trackers, \
search, documents, code repos, etc.), call the appropriate tool. Think step by \
step, and when a tool call fails, consider whether different arguments would work \
before giving up. When you have what you need, give the user a clear, direct answer."""


async def build_agent():
    model = build_model()
    mcp_client, tools = await load_mcp_tools()
    agent = create_agent(model, tools, system_prompt=SYSTEM_PROMPT)
    return agent, mcp_client
