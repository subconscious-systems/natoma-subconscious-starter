# Natoma × Subconscious Hackathon Starter

A reference implementation for building tool-using agents on the Subconscious model and the Natoma MCP gateway. The repository contains parallel Python and TypeScript projects, each implementing a minimal command-line agent on LangGraph, along with walkthroughs for extending the agent into a web application.

## Overview

- **[Natoma](https://natoma.ai)** is a managed MCP gateway that exposes connected services — Gmail, Linear, GitHub, Notion, Slack, Brave Search, AWS, and others — through a single endpoint URL and API key per connection. No local MCP servers are required.
- **[Subconscious](https://subconscious.dev)** provides an OpenAI-compatible chat completions API powered by a model optimised for long-context, multi-step reasoning. Native tool calling and image inputs are supported.
- **[LangGraph](https://langchain-ai.github.io/langgraph/)** orchestrates the agent loop. The starter uses the prebuilt ReAct agent so the full wiring fits in a single module per language.

## Setup

Complete these steps before running either starter.

### 1. Connect your MCPs at Natoma

Sign in at [natoma.ai](https://natoma.ai) and connect each integration you plan to give the agent — Gmail, Linear, GitHub, Notion, Slack, Brave Search, AWS, and so on. For every connection, copy the MCP URL and API key; you will paste them into the starter's `.env` file in the next step. A full walkthrough is in [`docs/natoma-setup.md`](docs/natoma-setup.md).

You can start with a single MCP and add more later — the agent picks up new entries automatically on restart.

### 2. Get a Subconscious API key

Request access at [subconscious.dev](https://subconscious.dev) and copy your API key.

### 3. Install a language runtime

Either Python 3.11+ with [uv](https://docs.astral.sh/uv/), **or** Node.js 20+ with [pnpm](https://pnpm.io/).

## Quick start

### Python

```bash
cd python
cp .env.example .env   # add your Subconscious and Natoma keys
uv sync
uv run python agent.py
```

### TypeScript

```bash
cd typescript
cp .env.example .env   # add your Subconscious and Natoma keys
pnpm install
pnpm start
```

## Repository layout

```text
.
├── python/         LangGraph + Python CLI agent
├── typescript/     LangGraph.js + TypeScript CLI agent
└── docs/
    ├── natoma-setup.md   Configuring Natoma MCP connections
    ├── prizes.md         Hackathon prize categories and judging criteria
    └── ideas.md          Suggested agent concepts
```

The two language folders mirror each other. `model.*` constructs the Subconscious client, `mcp.*` discovers Natoma MCP servers from environment variables, and `graph.*` assembles the agent. Adding a new MCP requires no code changes: set a paired `NATOMA_MCP_<NAME>_URL` and `NATOMA_MCP_<NAME>_KEY` in `.env` and the agent registers it on startup.

## Model capabilities

The Subconscious model supports:

- Long-context reasoning over large volumes of tool output.
- OpenAI-compatible function calling, consumed directly by LangGraph's tool node.
- Image inputs via OpenAI-style `image_url` content blocks.
- Document workflows by pre-extracting text and passing it as context.

## Adding a user interface

Each starter ships with a walkthrough for promoting the CLI agent into a web application:

- Python — [Streamlit](python/docs/ui-streamlit.md)
- TypeScript — [Next.js](typescript/docs/ui-nextjs.md)

Both walkthroughs reuse the existing `graph` module, so the agent definition stays in one place.

## Hackathon prizes

Submissions compete in two categories:

- **Most Useful** — solves a concrete workflow problem end-to-end.
- **Most Creative** — an original or unexpected application of the stack.

Judging criteria and submission requirements are in [`docs/prizes.md`](docs/prizes.md).

## License

Released under the [MIT License](LICENSE).
