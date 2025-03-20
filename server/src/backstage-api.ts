export type EntityKind = 'Component'|'System'|'Resource'|'API'|'Domain'|'Location'

export type EntityBase = {
  metadata: {
    namespace: string
    annotations: {
      [key: string]: string
    },
    name: string
    description: string
    tags: string[]
    uid: string
    etag: string
  }

  apiVersion: string
  kind: EntityKind
  spec: {
    // These could be narrowed down based on "kind"
    [key: string]: string
  },
  relations: {
    // These could be narrowed down based on "kind"
    type: string
    targetRef: string
  }[]
  
}

export type BackstageApiReponse<EntityType extends EntityBase> = {
  items: EntityType[]
}

export function createBackstageApiWrapper (params: { token: string, baseUrl: string }) {
  console.log('creating backstage wrapper with ', {params})
  return {
    async _httpRequest (path: string): Promise<any> {
      const u = new URL(path, params.baseUrl)
      const res = await fetch(u.toString(), {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${params.token}`
        }
      })

      const j = await res.json()

      if (res.status === 200) {
        return j
      } else {
        throw new Error(`Backstage API returned a HTTP ${res.status}`)
      }
    },

    async getEntityByUid(uid: string) {
      return this._httpRequest(`api/catalog/entities/by-uid/${uid}`)
    },

    async getEntities (kind: EntityKind) {
      return this._httpRequest(`api/catalog/entities/by-query?filter=kind=${kind.toLowerCase()}`)
    }
  }
}