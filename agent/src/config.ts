import { from } from 'env-var'

export default function getConfig (env: NodeJS.ProcessEnv) {
  const { get } = from(env)

  return {
    MCP_SERVER_URL: get('MCP_SERVER_URL').default('http://localhost:8080/sse').asUrlString()
  }
}