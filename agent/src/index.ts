global.EventSource = require('eventsource').EventSource

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { MCPTool } from "bee-agent-framework/tools/mcp";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { UnconstrainedMemory } from "bee-agent-framework/memory/unconstrainedMemory";
// import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { OpenAIChatLLM } from "bee-agent-framework/adapters/openai/chat";

import getConfig from "./config";

const { MCP_SERVER_URL } = getConfig(process.env)
const client = new Client(
  {
    name: "mcp-bee-example-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  },
);

main()

async function main() {
  console.log('Creating MCP Client to connect on SSE')
  
  await client.connect(
    new SSEClientTransport(new URL(MCP_SERVER_URL)),
  );

  try {
    // Server usually supports several tools, use the factory for automatic discovery
    console.log('Create the MCPTool using connected client')
    const tools = await MCPTool.fromClient(client);
    const agent = new BeeAgent({
      // llm: new OllamaChatLLM({
      //   modelId: 'granite3-dense:8b'
      // }),
      llm: new OpenAIChatLLM({
        modelId: "gpt-4o"
      }),
      memory: new UnconstrainedMemory(),
      tools,
    });

    await agent.run({ prompt: "List my Components in Backstage" }).observe((emitter) => {
      emitter.on("update", async ({ data, update, meta }) => {
        console.log(`Agent (${update.key}) 🤖 : `, update.value);
      });
    });

    await agent.run({ prompt: "How can I update a pet in the petstore Component using the HTTP API it exposes? Make sure to examine its OpenAPI Spec to determine your answer." }).observe((emitter) => {
      emitter.on("update", async ({ data, update, meta }) => {
        console.log(`Agent (${update.key}) 🤖 : `, update.value);
      });
    });
  } finally {
    await client.close();
  }
}