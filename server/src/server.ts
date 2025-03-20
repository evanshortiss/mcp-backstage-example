#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createBackstageApiWrapper } from "./backstage-api.js";
import { Logger } from "pino";

type McpServerConfig = {
  log: Logger,
  token: string,
  baseUrl: string
}

export default function getMcpServer (config: McpServerConfig) {
  const { log, token, baseUrl } = config

  const server = new Server(
    {
      name: "backstage",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const f = z.object({
    kind: z.string().toLowerCase().pipe(z.enum(['component', 'resource', 'system', 'api', 'location', 'user', 'group'])),
    // metadata: z.object({
    //   name: z.string(),
    //   namespace: z.string(),
    //   annotations: z.record(z.string(), z.string()),
    // }).optional(),
    // description: z.string().optional(),
    // tags: z.array(z.string()).optional(),
    // spec: z.object({
    //   type: z.string(),
    //   owner: z.string()
    // }).optional()
  })

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_entities",
          description: "List Backstage entities such as Components, Systems, Resources, APIs, Locations, Users, and Groups. Results are returned in JSON array format, where each entry is an object containing the entity 'name' and 'uid'.",
          inputSchema: zodToJsonSchema(f)
        },
        {
          name: "get_entity_details",
          description: "Retrieve an entity such as a Component, System, Resource, API, Location, User, or Group by its uid. Results are returned in JSON format.",
          inputSchema: zodToJsonSchema(z.object({
            uid: z.string().describe('The unique ID (uid) of the entity. This is a UUID, e.g UUID v4 format string')
          }))
        }
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const api = createBackstageApiWrapper({
      token,
      baseUrl
    })

    try {
      if (!request.params.arguments) {
        throw new Error("Arguments are required for a tool call.");
      }

      log.info(`Received tool call "${request.params.name}"`)

      switch (request.params.name) {
        case "list_entities": {
          const entities = await api.getEntities(request.params.arguments['kind'] as any) // TODO verify input

          const text = JSON.stringify(entities.items.map((e: any) => {
            return { uid: e.metadata.uid, name: e.metadata.name }
          }))

          return {
            content: [{
              type: "text",
              text
            }]
          };
        }

        case "get_entity_details": {
          const e = await api.getEntityByUid(request.params.arguments['uid'] as any) // TODO verify input

          return {
            content: [{ type: "text", text: JSON.stringify(e, null, 2) }],
          };
        }

        default:
          throw new Error(`Unknown tool call "${request.params.name}"`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
      }

      throw error;
    }
  });

  return server
}