# TypeScript agent

A minimal CLI agent in ~120 lines. LangGraph.js + Subconscious + Natoma MCPs.

## Setup

You need Node 20+ and [pnpm](https://pnpm.io/) (`brew install pnpm` or `npm install -g pnpm`).

```bash
cp .env.example .env
# Edit .env: paste SUBCONSCIOUS_API_KEY and at least one MCP pair —
# either NATOMA_MCP_<NAME>_URL/_KEY (Natoma-managed) or MCP_<NAME>_URL/_KEY (direct).

pnpm install
pnpm start
```

## File tour

```text
typescript/
├── package.json     Dependencies pinned for hackathon stability.
├── tsconfig.json
├── images/          Bundled image fixtures used by the sample_image tool.
└── src/
    ├── agent.ts     Entrypoint — streaming REPL loop (run with `npm start` via tsx).
    ├── model.ts     Subconscious client (ChatOpenAI with custom auth header).
    ├── mcp.ts       Discovers MCPs (Natoma-managed + direct) from env, loads their tools.
    ├── tools.ts     Custom (non-MCP) tools registered alongside MCP ones.
    └── graph.ts     createAgent({ model, tools }) — the whole agent.
```

## Making it yours

- **Edit the system prompt** in `src/graph.ts` to shape behavior.
- **Add more MCPs** in `.env` — they're picked up automatically. No code change.
  Two patterns are supported: `NATOMA_MCP_<NAME>_URL/_KEY` (Natoma gateway) and
  `MCP_<NAME>_URL/_KEY` (any service's own MCP endpoint, auth as
  `Authorization: Bearer <key>`).
- **Add a custom tool.** Define one with `tool(...)` in `src/tools.ts` and
  append it to `getCustomTools()` — `graph.ts` registers MCP + custom tools
  together. See the bundled `sampleImage` tool for a multimodal example.
- **Add memory across turns.** Use a checkpointer:

  ```ts
  import { MemorySaver } from "@langchain/langgraph";
  const agent = createAgent({ model, tools, systemPrompt: SYSTEM_PROMPT, checkpointer: new MemorySaver() });
  // then pass { configurable: { thread_id: "session-1" } } as the second arg to invoke()
  ```

## Going further

Wrap this same `graph.ts` in a Next.js chat UI: see [docs/ui-nextjs.md](docs/ui-nextjs.md).
