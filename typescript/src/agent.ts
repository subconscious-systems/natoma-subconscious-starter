import "dotenv/config";
import * as readline from "node:readline/promises";

import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { buildAgent } from "./graph.js";

function preview(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function printNewMessages(messages: BaseMessage[], startIndex: number): void {
  for (const msg of messages.slice(startIndex)) {
    if (msg instanceof AIMessage) {
      const toolCalls = msg.tool_calls ?? [];
      for (const tc of toolCalls) {
        const args = preview(JSON.stringify(tc.args ?? {}), 120);
        console.log(`  [tool] ${tc.name}(${args})`);
      }
      if (typeof msg.content === "string" && msg.content.length > 0) {
        console.log(`agent > ${msg.content}`);
      }
    } else if (msg instanceof ToolMessage) {
      console.log(`  [tool result] ${preview(String(msg.content), 240)}`);
    }
  }
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
      const start = messages.length;
      const result = await agent.invoke({ messages });
      messages = result.messages as BaseMessage[];
      printNewMessages(messages, start);
      console.log();
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
