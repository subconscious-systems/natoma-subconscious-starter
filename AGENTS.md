# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, etc.) working in this repository.

## What this is

A hackathon starter for building tool-using agents on the **Subconscious** model and the **Natoma** MCP gateway. Two parallel implementations:

- `python/` — LangGraph + uv
- `typescript/` — LangGraph.js + pnpm

Both folders mirror each other in shape and naming so changes can be applied in parallel.

## The stack

### Subconscious — just a Chat Completions API

Subconscious is **not** a special SDK or framework. It's an OpenAI-compatible `POST /v1/chat/completions` endpoint, so anything that speaks the OpenAI API speaks Subconscious. There is nothing else to learn.

Three things to know:

1. Base URL: `https://api.subconscious.dev/v1`
2. Auth header: `Authorization: Api-Key <key>` (note: **not** `Bearer`)
3. Default model: `subconscious/tim-qwen3.6-27b`

Native function calling and image inputs (OpenAI-style `image_url` content blocks) are supported.

**Raw curl example:**

```bash
curl https://api.subconscious.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Api-Key $SUBCONSCIOUS_API_KEY" \
  -d '{
    "model": "subconscious/tim-qwen3.6-27b",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**OpenAI SDK (Python):**

```python
from openai import OpenAI

client = OpenAI(
    api_key="not-used",
    base_url="https://api.subconscious.dev/v1",
    default_headers={"Authorization": f"Api-Key {key}"},
)
client.chat.completions.create(
    model="subconscious/tim-qwen3.6-27b",
    messages=[{"role": "user", "content": "Hello"}],
)
```

The starter wraps this in `langchain-openai`'s `ChatOpenAI` so LangGraph can do tool calling — see `python/src/model.py` and `typescript/src/model.ts`.

### Natoma — managed MCP gateway

Natoma exposes connected services (Gmail, Linear, GitHub, Notion, Slack, Brave Search, AWS, Context7, Resend, …) as remote MCP servers. Each connection has its own URL and API key.

- Platform: <https://natoma.ai>
- Docs: <https://docs.natoma.ai/>
- Solutions for developers: <https://natoma.ai/solutions/developers>

The starter connects over MCP's HTTP transport. URLs look like:

```text
https://<integration>.mcp.natoma.app/v2/user/my-connections/mcp
```

Auth defaults to `Authorization: Bearer <natoma-key>` and is overridable via `NATOMA_AUTH_HEADER` / `NATOMA_AUTH_SCHEME` env vars (see `docs/natoma-setup.md`).

### LangGraph — agent orchestration

Both starters use `create_agent` from the `langchain` package (Python and JS). It builds a ReAct-style tool-calling loop in one call:

```python
# python/src/graph.py
from langchain.agents import create_agent
agent = create_agent(model, tools, system_prompt=SYSTEM_PROMPT)
```

```ts
// typescript/src/graph.ts
import { createAgent } from "langchain";
const agent = createAgent({ model, tools, systemPrompt: SYSTEM_PROMPT });
```

The earlier `create_react_agent` API from `langgraph.prebuilt` is deprecated in JS as of LangGraph 1.x and superseded in Python by `langchain.agents.create_agent`.

## File layout (both languages)

| File          | Purpose                                                           |
| ------------- | ----------------------------------------------------------------- |
| `model.*`     | Builds the Subconscious chat client (ChatOpenAI + custom header). |
| `mcp.*`       | Discovers Natoma MCPs from env vars, returns LangChain tools.     |
| `graph.*`     | Wires model + tools into an agent via `create_agent`.             |
| `agent.*`     | REPL entrypoint.                                                  |

## Environment-variable conventions

MCPs are configured by paired env vars — no code changes to add one:

```text
NATOMA_MCP_<NAME>_URL=https://<integration>.mcp.natoma.app/...
NATOMA_MCP_<NAME>_KEY=<api-key>
```

`<NAME>` is a free-form label (`GMAIL`, `LINEAR`, `WORK_INBOX`, …). On startup, both starters scan `process.env` / `os.environ` for matching pairs and register them automatically.

Additional env knobs:

- `SUBCONSCIOUS_API_KEY` — required.
- `SUBCONSCIOUS_BASE_URL` — defaults to `https://api.subconscious.dev/v1`.
- `SUBCONSCIOUS_MODEL` — defaults to `subconscious/tim-qwen3.6-27b`.
- `SUBCONSCIOUS_ENABLE_THINKING` — set to `1` to enable the model's thinking step. Off by default; the model behaves like a standard chat completion. The starter passes `chat_template_kwargs.enable_thinking=false` in the request body (Python via `ChatOpenAI(extra_body=...)`; TS via `ChatOpenAI({ modelKwargs: ... })`).
- `NATOMA_AUTH_HEADER` — defaults to `Authorization`.
- `NATOMA_AUTH_SCHEME` — defaults to `Bearer`. Set empty for a raw key.

## Conventions when editing this repo

- **Keep Python and TypeScript in sync.** Same module names, same function names where possible. If you refactor `mcp.ts`, mirror the change in `mcp.py`.
- **Pin dependency versions.** No `^`, `~`, or `*` in `pyproject.toml` / `package.json`. Hackathon-day stability matters more than getting the newest patch.
- **System prompts live in `graph.{py,ts}`.** Don't sprinkle prompt fragments into the REPL.
- **Never log API keys.** The discovery code prints MCP *names*, never values.
- **Streamable-HTTP transport literal differs between SDKs:** Python uses `"streamable_http"`, TypeScript uses `"http"`. Both are correct for their respective adapters.

## Running and verifying

```bash
# Python
cd python && uv sync && uv run python agent.py

# TypeScript
cd typescript && pnpm install && pnpm start

# Typecheck (TS only)
cd typescript && pnpm typecheck
```

## External references

- Subconscious: <https://subconscious.dev>
- Natoma docs: <https://docs.natoma.ai/>
- Natoma platform: <https://natoma.ai>
- LangGraph: <https://langchain-ai.github.io/langgraph/>
- LangChain (Python `create_agent`): <https://python.langchain.com/>
- LangChain (JS `createAgent`): <https://js.langchain.com/>
- MCP spec: <https://modelcontextprotocol.io/>
