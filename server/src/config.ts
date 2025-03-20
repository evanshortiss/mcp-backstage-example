import ev from 'env-var'
import { Level, levels } from 'pino'

export default function getConfig (env: NodeJS.ProcessEnv) {
  const { get } = ev.from(env)

  return {
    BACKSTAGE_SERVER_URL: get('BACKSTAGE_SERVER_URL').required().asUrlString(),
    BACKSTAGE_API_TOKEN: get('BACKSTAGE_API_TOKEN').required().asString(),

    HTTP_HOST: get('HTTP_HOST').default('0.0.0.0').asString(),
    HTTP_PORT: get('HTTP_PORT').default(8080).asPortNumber(),

    LOG_LEVEL: get('LOG_LEVEL').default('info').asEnum<Level>(Object.keys(levels.values) as Level[])
  }
}