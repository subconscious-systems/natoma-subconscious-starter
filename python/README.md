# Python agent

A minimal CLI agent in ~120 lines. LangGraph + Subconscious + Natoma MCPs.

## Setup

You need Python 3.11+ and [uv](https://docs.astral.sh/uv/) (`brew install uv` or `pipx install uv`).

```bash
cp .env.example .env
# Edit .env: paste SUBCONSCIOUS_API_KEY and at least one NATOMA_MCP_*_URL/_KEY pair.

uv sync
uv run python agent.py
```

## File tour

```text
python/
├── agent.py         Entrypoint — REPL loop.
├── pyproject.toml   Dependencies pinned for hackathon stability.
└── src/
    ├── model.py     Subconscious client (ChatOpenAI with custom auth header).
    ├── mcp.py       Discovers Natoma MCPs from env, loads their tools.
    └── graph.py     create_agent(model, tools) — the whole agent.
```

## Making it yours

- **Edit the system prompt** in `src/graph.py` to shape behavior.
- **Add more MCPs** in `.env` — they're picked up automatically. No code change.
- **Send images.** In `agent.py`, swap `HumanMessage(content=user_input)` for:

  ```python
  HumanMessage(content=[
      {"type": "text", "text": user_input},
      {"type": "image_url", "image_url": {"url": "https://..."}},
  ])
  ```

- **Add memory across turns.** Use a checkpointer:

  ```python
  from langgraph.checkpoint.memory import InMemorySaver
  agent = create_agent(model, tools, system_prompt=SYSTEM_PROMPT, checkpointer=InMemorySaver())
  # then pass config={"configurable": {"thread_id": "session-1"}} to ainvoke()
  ```

- **Inspect what the model is doing.** Set `LANGCHAIN_TRACING_V2=true` and a LangSmith key, or print the full `result["messages"]` to see the trace.

## Going further

Wrap this same `graph.py` in a Streamlit chat UI: see [docs/ui-streamlit.md](docs/ui-streamlit.md).
