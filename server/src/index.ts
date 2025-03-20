import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { ErrorRequestHandler } from "express";
import { pinoHttp } from 'pino-http'
import getMcpServer from "./server.js";
import getConfig from "./config.js";
import getLogger from "./logger.js";

const {
  HTTP_HOST,
  HTTP_PORT,
  LOG_LEVEL,
  BACKSTAGE_API_TOKEN,
  BACKSTAGE_SERVER_URL
} = getConfig(process.env)

const log = getLogger(LOG_LEVEL)

const server = getMcpServer({
  log,
  token: BACKSTAGE_API_TOKEN,
  baseUrl: BACKSTAGE_SERVER_URL
})

const app = express();

app.use(pinoHttp({
  logger: log
}))

const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res, next) => {
  const transport = new SSEServerTransport("/message", res)
  const { sessionId } = transport
  
  log.info(`Agent ${sessionId} connected`);

  transport.onclose = () => {
    log.info(`Agent ${sessionId} disconnected`)
    transports.delete(sessionId)
  }
  
  transports.set(sessionId, transport);

  try {
    await server.connect(transport)
  } catch (e) {
    next(e)
  }
});

app.post("/message", async (req, res, next) => {
  const { sessionId } = req.query as any

  if (!sessionId) {
    res.status(400).end()
  } else {
    log.info(`Agent ${sessionId} message`);
    const transport = transports.get(sessionId)

    if (!transport) {
      next(new Error(`transport not found for agent session ${sessionId}`))
    } else {
      try {
        await transport.handlePostMessage(req, res)
      } catch (e) {
        next(e)
      }
    }
  }
});

app.use(((err, req, res, next) => {
  const { method, path } = req
  
  log.error(`Error processing ${method} ${path}`)
  log.error(err)

  res.end('internal server error')
}) as ErrorRequestHandler)

app.listen(HTTP_PORT, HTTP_HOST, () => {
  log.info(`Server is running on port ${HTTP_PORT}`);
});