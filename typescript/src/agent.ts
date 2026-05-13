import "dotenv/config";
import * as readline from "node:readline/promises";

import { HumanMessage, type BaseMessage } from "@langchain/core/messages";

import { buildAgent } from "./graph.js";

function preview(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function elapsed(t0: number): string {
  return `[${((performance.now() - t0) / 1000).toFixed(1)}s]`;
}

async function main(): Promise<void> {
  console.log("Loading agent…");
  const { agent } = await buildAgent();
  console.log();
  console.log("Subconscious × Natoma agent. Type 'exit' or Ctrl-D to quit.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let messages: BaseMessage[] = [];
  try {
    while (true) {
      const userInput = (await rl.question("you > ")).trim();
      if (!userInput) continue;
      if (["exit", "quit"].includes(userInput.toLowerCase())) break;

      messages.push(new HumanMessage(userInput));

      const t0 = performance.now();
      let streamingText = false;
      const pendingToolCalls: Record<
        string | number,
        { name: string; args: string }
      > = {};

      for await (const event of agent.streamEvents(
        { messages },
        { version: "v2" },
      )) {
        const kind = event.event;
        const ts = elapsed(t0);

        if (kind === "on_chat_model_stream") {
          const chunk = event.data?.chunk;
          if (!chunk) continue;
          const content = chunk.content;
          if (typeof content === "string" && content) {
            if (!streamingText) {
              process.stdout.write("\nagent > ");
              streamingText = true;
            }
            process.stdout.write(content);
          }
          const tcChunks = chunk.tool_call_chunks ?? [];
          for (const tc of tcChunks) {
            const idx = tc.index ?? tc.id ?? 0;
            if (!pendingToolCalls[idx]) {
              pendingToolCalls[idx] = { name: "", args: "" };
            }
            if (tc.name) pendingToolCalls[idx].name += tc.name;
            if (tc.args) pendingToolCalls[idx].args += tc.args;
          }
        } else if (kind === "on_chat_model_end") {
          if (streamingText) {
            process.stdout.write("\n");
            streamingText = false;
          }
          for (const tc of Object.values(pendingToolCalls)) {
            const args = preview(tc.args, 120);
            console.log(`  ${ts} [calling] ${tc.name}(${args})`);
          }
          for (const k of Object.keys(pendingToolCalls)) {
            delete pendingToolCalls[k];
          }
        } else if (kind === "on_tool_start") {
          const name = event.name ?? "?";
          console.log(`  ${ts} [tool start] ${name}`);
        } else if (kind === "on_tool_end") {
          const name = event.name ?? "?";
          const output = preview(String(event.data?.output ?? ""), 240);
          console.log(`  ${ts} [tool done]  ${name} → ${output}`);
        } else if (kind === "on_chain_end" && event.name === "LangGraph") {
          const finalOutput = event.data?.output;
          if (
            finalOutput &&
            typeof finalOutput === "object" &&
            "messages" in finalOutput
          ) {
            messages = (finalOutput as { messages: BaseMessage[] }).messages;
          }
        }
      }

      const total = ((performance.now() - t0) / 1000).toFixed(1);
      console.log(`  [${total}s total]\n`);
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
