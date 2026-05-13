# Python agent

A minimal CLI agent in ~120 lines. LangGraph + Subconscious + Natoma MCPs.

## Setup

You need Python 3.11+ and [uv](https://docs.astral.sh/uv/) (`brew install uv` or `pipx install uv`).

```bash
cp .env.example .env
# Edit .env: paste SUBCONSCIOUS_API_KEY and at least one MCP pair —
# either NATOMA_MCP_<NAME>_URL/_KEY (Natoma-managed) or MCP_<NAME>_URL/_KEY (direct).

uv sync
uv run python agent.py
```

## File tour

```text
python/
├── agent.py         Entrypoint — streaming REPL loop.
├── pyproject.toml   Dependencies pinned for hackathon stability.
├── images/          Bundled image fixtures used by the sample_image tool.
└── src/
    ├── model.py     Subconscious client (ChatOpenAI with custom auth header).
    ├── mcp.py       Discovers MCPs (Natoma-managed + direct) from env, loads their tools.
    ├── tools.py     Custom (non-MCP) tools registered alongside MCP ones.
    └── graph.py     create_agent(model, tools) — the whole agent.
```

## Making it yours

- **Edit the system prompt** in `src/graph.py` to shape behavior.
- **Add more MCPs** in `.env` — they're picked up automatically. No code change.
  Two patterns are supported: `NATOMA_MCP_<NAME>_URL/_KEY` (Natoma gateway) and
  `MCP_<NAME>_URL/_KEY` (any service's own MCP endpoint, auth as
  `Authorization: Bearer <key>`).
- **Add a custom tool.** Drop a `@tool` function into `src/tools.py` and append
  it to `get_custom_tools()` — `graph.py` registers MCP + custom tools together.
  See the bundled `sample_image` tool for a multimodal example.
- **Add memory across turns.** Use a checkpointer:

  ```python
  from langgraph.checkpoint.memory import InMemorySaver
  agent = create_agent(model, tools, system_prompt=SYSTEM_PROMPT, checkpointer=InMemorySaver())
  # then pass config={"configurable": {"thread_id": "session-1"}} to ainvoke()
  ```

- **Inspect what the model is doing.** The REPL already streams text, tool
  calls, and per-step timing via `agent.astream_events(...)`. For deeper
  tracing, set `LANGCHAIN_TRACING_V2=true` and a LangSmith key.

## Going further

Wrap this same `graph.py` in a Streamlit chat UI: see [docs/ui-streamlit.md](docs/ui-streamlit.md).
