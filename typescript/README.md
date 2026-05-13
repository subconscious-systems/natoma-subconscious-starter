# TypeScript agent

A minimal CLI agent in ~120 lines. LangGraph.js + Subconscious + Natoma MCPs.

## Setup

You need Node 20+ and [pnpm](https://pnpm.io/) (`brew install pnpm` or `npm install -g pnpm`).

```bash
cp .env.example .env
# Edit .env: paste SUBCONSCIOUS_API_KEY and at least one NATOMA_MCP_*_URL/_KEY pair.

pnpm install
pnpm start
```

## File tour

```text
typescript/
├── package.json     Dependencies pinned for hackathon stability.
├── tsconfig.json
└── src/
    ├── agent.ts     Entrypoint — REPL loop (run with `npm start` via tsx).
    ├── model.ts     Subconscious client (ChatOpenAI with custom auth header).
    ├── mcp.ts       Discovers Natoma MCPs from env, loads their tools.
    └── graph.ts     createAgent({ model, tools }) — the whole agent.
```

## Making it yours

- **Edit the system prompt** in `src/graph.ts` to shape behavior.
- **Add more MCPs** in `.env` — they're picked up automatically. No code change.
- **Send images.** In `agent.ts`, swap `new HumanMessage(userInput)` for:

  ```ts
  new HumanMessage({
    content: [
      { type: "text", text: userInput },
      { type: "image_url", image_url: { url: "https://..." } },
    ],
  });
  ```

- **Add memory across turns.** Use a checkpointer:

  ```ts
  import { MemorySaver } from "@langchain/langgraph";
  const agent = createAgent({ model, tools, systemPrompt: SYSTEM_PROMPT, checkpointer: new MemorySaver() });
  // then pass { configurable: { thread_id: "session-1" } } as the second arg to invoke()
  ```

## Going further

Wrap this same `graph.ts` in a Next.js chat UI: see [docs/ui-nextjs.md](docs/ui-nextjs.md).
