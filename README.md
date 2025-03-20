# Bee Agent & Model Context Protocol with Backstage

This repository demonstrates how to create a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
server that provides tools that LLMs can use to communicate with a Backstage
instance. A sample Agent, built using the [Bee Agent Framework](https://i-am-bee.github.io/bee-agent-framework/#/),
is included to demonstrate how to interact with the MCP server.

## Run the Demo

### Configure Backstage

Enable static, token-based, access to Backstage. This allows a client to
interact with the HTTP API using the `token` in an `authorization` header.

```yaml
appConfig:
  backend:
    auth:
      externalAccess:
      - type: static
        options:
        token: 'notasecuretoken'
        subject: mcp
```

### Run the MCP Server

Install dependencies and prepare environment variables:

```bash
cd server
npm i
cp .env.template .env
```

Edit the `.env` file to with valid values, then start the server:

```bash

# Load variables
source .env

# Build and run the server
npm run build && npm start 
```

The MCP server will start listening on http://localhost:8080

### Run the Agent

In another terminal, install dependencies and set environment variables:

```bash
cd agent
cp .env.template .env
npm i
```

Run the agent:

```bash
npm run build && npm start
```