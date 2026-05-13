import { createAgent } from "langchain";

import { loadMcpTools } from "./mcp.js";
import { buildModel } from "./model.js";
import { getCustomTools } from "./tools.js";

const SYSTEM_PROMPT = `You are a helpful agent with access to tools.

When a task requires data or actions in external systems (email, issue trackers, search, documents, code repos, etc.), call the appropriate tool. Think step by step, and when a tool call fails, consider whether different arguments would work before giving up. When you have what you need, give the user a clear, direct answer.

You also have a sample_image tool. When the user asks to see a sample image or wants to test image handling, call it. The tool returns multimodal content including images.`;

export async function buildAgent() {
  const model = buildModel();
  const { client, tools: mcpTools } = await loadMcpTools();
  const customTools = getCustomTools();
  const allTools = [...mcpTools, ...customTools];
  console.log(
    `  registered ${allTools.length} total tool(s) ` +
      `(${mcpTools.length} MCP + ${customTools.length} custom)`,
  );
  const agent = createAgent({
    model,
    tools: allTools,
    systemPrompt: SYSTEM_PROMPT,
  });
  return { agent, mcpClient: client };
}
