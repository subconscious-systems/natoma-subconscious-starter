"""The agent graph: Subconscious model + MCP / custom tools, wired by LangChain."""
from langchain.agents import create_agent

from src.mcp import load_mcp_tools
from src.model import build_model
from src.tools import get_custom_tools


SYSTEM_PROMPT = """You are a helpful agent with access to tools.

When a task requires data or actions in external systems (email, issue trackers, \
search, documents, code repos, etc.), call the appropriate tool. Think step by \
step, and when a tool call fails, consider whether different arguments would work \
before giving up. When you have what you need, give the user a clear, direct answer.

You also have a sample_image tool. When the user asks to see a sample image or \
wants to test image handling, call it. The tool returns multimodal content including images."""


async def build_agent():
    model = build_model()
    mcp_client, mcp_tools = await load_mcp_tools()
    custom_tools = get_custom_tools()
    all_tools = (mcp_tools or []) + custom_tools
    print(f"  registered {len(all_tools)} total tool(s) "
          f"({len(mcp_tools or [])} MCP + {len(custom_tools)} custom)")
    agent = create_agent(model, all_tools, system_prompt=SYSTEM_PROMPT)
    return agent, mcp_client
