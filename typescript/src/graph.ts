import { createAgent } from "langchain";

import { loadMcpTools } from "./mcp.js";
import { buildModel } from "./model.js";

const SYSTEM_PROMPT = `You are a helpful agent with access to tools exposed via Natoma MCPs.

When a task requires data or actions in external systems (email, issue trackers, search, documents, code repos, etc.), call the appropriate tool. Think step by step, and when a tool call fails, consider whether different arguments would work before giving up. When you have what you need, give the user a clear, direct answer.`;

export async function buildAgent() {
  const model = buildModel();
  const { client, tools } = await loadMcpTools();
  const agent = createAgent({
    model,
    tools,
    systemPrompt: SYSTEM_PROMPT,
  });
  return { agent, mcpClient: client };
}
