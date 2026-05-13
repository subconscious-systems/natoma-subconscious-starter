# Wrap the agent in a Next.js chat UI

Once the CLI agent works (`pnpm start`), you can move it into a Next.js app with streaming. The same `graph.ts` runs server-side; the browser just sees a chat window.

## 1. Scaffold a Next.js app

From the **repo root** (not inside `typescript/`):

```bash
pnpm dlx create-next-app@latest web --typescript --app --no-tailwind --no-src-dir --import-alias "@/*"
cd web
pnpm add langchain @langchain/core @langchain/langgraph @langchain/openai @langchain/mcp-adapters dotenv ai
```

The `ai` package is the [Vercel AI SDK](https://sdk.vercel.ai/) — gives you streaming and a `useChat` hook for free.

## 2. Copy the agent code

Copy `typescript/src/{model.ts,mcp.ts,graph.ts}` into `web/lib/agent/` (drop the `.js` import suffixes if Next.js complains — Next allows omitting them in TypeScript).

Add your `.env` at the project root next to `package.json` (Next loads it automatically).

## 3. Create a streaming route handler

```ts
// web/app/api/chat/route.ts
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { buildAgent } from "@/lib/agent/graph";

// Reuse one agent + MCP connection across requests during dev.
let agentPromise: ReturnType<typeof buildAgent> | null = null;
function getAgent() {
  if (!agentPromise) agentPromise = buildAgent();
  return agentPromise;
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const { agent } = await getAgent();

  const lcMessages = messages.map((m: { role: string; content: string }) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const event of agent.streamEvents(
        { messages: lcMessages },
        { version: "v2" },
      )) {
        if (event.event === "on_chat_model_stream") {
          const chunk = event.data?.chunk;
          const text =
            typeof chunk?.content === "string" ? chunk.content : "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

## 4. A minimal chat page

```tsx
// web/app/page.tsx
"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const next: Msg[] = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setPending(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: next }),
    });
    if (!res.body) {
      setPending(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    setMessages([...next, { role: "assistant", content: "" }]);
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value);
      setMessages([...next, { role: "assistant", content: acc }]);
    }
    setPending(false);
  }

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Natoma × Subconscious</h1>
      <div style={{ minHeight: 400 }}>
        {messages.map((m, i) => (
          <p key={i}><b>{m.role}:</b> {m.content}</p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        disabled={pending}
        style={{ width: "100%", padding: 8 }}
        placeholder="Ask me something…"
      />
    </main>
  );
}
```

## 5. Run it

```bash
pnpm dev
```

Open <http://localhost:3000>.

## Gotchas

- **MCP connection lifecycle.** The route handler caches the agent in a module-level promise so MCP connections aren't re-established on every request. In production, you'd want graceful reconnection and per-user MCP configs.
- **Tool calls don't stream as text.** The `on_chat_model_stream` events only include the model's text deltas. If you want to surface "the agent is calling Gmail right now," listen for `on_tool_start` / `on_tool_end` events and push status frames into the stream.
- **Server-only secrets.** Keep your `.env` at the Next.js project root and never reference `SUBCONSCIOUS_API_KEY` in a client component — only inside `app/api/*` route handlers.

## What to build next

- **`useChat` from the Vercel AI SDK.** Drop the hand-rolled fetch + decoder; render tool calls as cards alongside the message stream.
- **File uploads.** Use `next/server`'s `formData()` to receive an image, upload to a CDN, pass the URL as an `image_url` content block.
- **Multi-user session memory.** Stamp a `thread_id` into each request and pair it with a LangGraph `PostgresSaver` so different users get isolated conversations.
