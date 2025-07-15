import * as N3 from "n3"
import { parseTTL } from "./ttl-parser"
import { cacheManager } from "./cache-manager"
import type { GraphData, GraphNode, GraphLink } from "./types"

function getTermName(term: N3.Term, prefixes: N3.Prefixes): string {
  if (term.termType === "NamedNode") {
    for (const prefix in prefixes) {
      if (term.value.startsWith(prefixes[prefix])) {
        return `${prefix}:${term.value.substring(prefixes[prefix].length)}`
      }
    }
    return term.value.split("/").pop()?.split("#").pop() || term.value
  }
  if (term.termType === "Literal") {
    return `"${term.value}"`
  }
  if (term.termType === "BlankNode") {
    return `_:${term.value}`
  }
  return term.value
}

function classifyEntity(
  uri: string,
  types: Set<string>,
  properties: Map<string, any[]>,
): "tree" | "region" | "observation" | "observationCollection" | "result" | undefined {
  if (types.has("http://www.w3.org/ns/sosa/ObservationCollection")) {
    return "observationCollection"
  }
  if (types.has("http://www.w3.org/ns/sosa/Result")) {
    return "result"
  }
  if (types.has("http://www.w3.org/ns/sosa/Observation")) {
    return "observation"
  }
  if (
    types.has("http://www.eionet.europa.eu/gemet/concept/8664") &&
    types.has("http://www.opengis.net/ont/geosparql#Feature") &&
    types.has("http://www.w3.org/ns/sosa/FeatureOfInterest")
  ) {
    return "tree"
  }
  if (types.has("http://www.opengis.net/ont/geosparql#Feature")) {
    return "region"
  }
  if (types.has("http://www.opengis.net/ont/sf#Point") || types.has("http://www.opengis.net/ont/sf#Polygon")) {
    return undefined
  }
  return undefined
}

function classifyRelationship(predicate: string): "spatial" | "taxonomic" | "observational" | "temporal" | undefined {
  if (predicate.includes("geosparql") || predicate.includes("sfWithin") || predicate.includes("hasGeometry")) {
    return "spatial"
  }
  if (
    predicate.includes("dwc") ||
    predicate.includes("family") ||
    predicate.includes("genus") ||
    predicate.includes("specificEpithet")
  ) {
    return "taxonomic"
  }
  if (
    predicate.includes("sosa") ||
    predicate.includes("hasResult") ||
    predicate.includes("hasFeatureOfInterest") ||
    predicate.includes("qudt") ||
    predicate.includes("hasMember") ||
    predicate.includes("observedProperty")
  ) {
    return "observational"
  }
  if (predicate.includes("resultTime") || predicate.includes("time")) {
    return "temporal"
  }
  return undefined
}

export class EnhancedTTLParser {
  private worker: Worker | null = null

  constructor() {
    if (typeof Worker !== "undefined") {
      this.worker = new Worker(
        new URL("./web-workers/ttl-parser-worker.ts", import.meta.url),
        { type: "module" }, // load worker as an ES module
      )
    }
  }

  async parseWithCache(ttlString: string, fileHash: string, limit = 1000): Promise<GraphData> {
    const cacheKey = `ttl-${fileHash}-${limit}`

    // Try to get from cache first
    const cached = cacheManager.get(cacheKey, fileHash)
    if (cached) {
      return cached
    }

    // Parse the TTL - always use main thread for now to avoid worker issues
    const result = await parseTTL(ttlString, limit)

    // Cache the result
    cacheManager.set(cacheKey, result, fileHash)

    return result
  }

  private parseWithWorker(ttlString: string, limit: number): Promise<GraphData> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not available"))
        return
      }

      const id = Math.random().toString(36).substr(2, 9)

      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.worker!.removeEventListener("message", handleMessage)

          if (e.data.success) {
            resolve(e.data.data)
          } else {
            reject(new Error(e.data.error))
          }
        }
      }

      this.worker.addEventListener("message", handleMessage)
      this.worker.postMessage({ ttlString, limit, id })
    })
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  private parseTTLProgressive(
    ttlString: string,
    limit = 1000,
    offset = 0,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<{ data: GraphData; hasMore: boolean }> {
    return new Promise((resolve, reject) => {
      const parser = new N3.Parser()
      const quads: N3.Quad[] = []
      const nodes = new Map<string, GraphNode>()
      const links: GraphLink[] = []
      const entityTypes = new Map<string, Set<string>>()
      const entityProperties = new Map<string, any[]>()
      let prefixes: N3.Prefixes = {}
      let totalQuadCount = 0
      let processedQuads = 0

      parser.parse(ttlString, (error, quad, p) => {
        if (error) {
          return reject(error)
        }

        if (quad) {
          totalQuadCount++

          // Skip quads before offset
          if (totalQuadCount <= offset) {
            return
          }

          // Process quads within limit
          if (processedQuads < limit) {
            quads.push(quad)
            processedQuads++

            // Track types and properties for entity classification
            const subjectUri = quad.subject.value
            if (!entityTypes.has(subjectUri)) {
              entityTypes.set(subjectUri, new Set())
              entityProperties.set(subjectUri, [])
            }

            if (quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
              entityTypes.get(subjectUri)!.add(quad.object.value)
            }

            entityProperties.get(subjectUri)!.push({
              predicate: quad.predicate.value,
              object: quad.object,
            })

            // Send progress updates
            if (processedQuads % 100 === 0 && onProgress) {
              onProgress(processedQuads, Math.min(limit, totalQuadCount - offset))
            }
          }
        } else {
          prefixes = p || {}

          const addNode = (term: N3.Term) => {
            if (!nodes.has(term.value)) {
              let type: "uri" | "literal" | "blank" = "uri"
              if (term.termType === "Literal") type = "literal"
              if (term.termType === "BlankNode") type = "blank"

              const entityType = classifyEntity(term.value, entityTypes.get(term.value) || new Set(), entityProperties)

              if (
                entityType === undefined &&
                (entityTypes.get(term.value)?.has("http://www.opengis.net/ont/sf#Point") ||
                  entityTypes.get(term.value)?.has("http://www.opengis.net/ont/sf#Polygon"))
              ) {
                return
              }

              const props = entityProperties.get(term.value) || []
              const taxonomicInfo: Record<string, string> = {}
              const observationInfo: Record<string, string> = {}
              const collectionInfo: Record<string, string> = {}
              let geometryType: string | undefined
              let coordinates: string | undefined

              // Extract information
              props.forEach((prop) => {
                if (prop.predicate.startsWith("http://rs.tdwg.org/dwc/terms/")) {
                  const key = prop.predicate.split("/").pop() || prop.predicate
                  taxonomicInfo[`dwc:${key}`] = prop.object.value
                }
                if (prop.predicate === "http://www.opengis.net/ont/geosparql#asWKT") {
                  const wkt = prop.object.value
                  if (wkt.startsWith("POINT")) {
                    geometryType = "Point"
                    coordinates = wkt.match(/POINT$$([^)]+)$$/)?.[1]
                  } else if (wkt.startsWith("POLYGON")) {
                    geometryType = "Polygon"
                    coordinates = "Polygon coordinates"
                  }
                }
                if (prop.predicate.includes("qudt") || prop.predicate.includes("numericValue")) {
                  observationInfo.numericValue = prop.object.value
                }
                if (prop.predicate.includes("unit")) {
                  observationInfo.unit = getTermName(prop.object, prefixes)
                }
                if (prop.predicate === "http://www.w3.org/ns/sosa/observedProperty") {
                  observationInfo.observedProperty = getTermName(prop.object, prefixes)
                }
                if (prop.predicate === "http://www.w3.org/ns/sosa/resultTime") {
                  observationInfo.resultTime = prop.object.value
                }
                if (prop.predicate === "http://purl.org/dc/terms/creator") {
                  collectionInfo.creator = prop.object.value
                }
                if (prop.predicate === "http://creativecommons.org/ns#license") {
                  collectionInfo.license = getTermName(prop.object, prefixes)
                }
              })

              nodes.set(term.value, {
                id: term.value,
                name: getTermName(term, prefixes),
                type: type,
                entityType,
                taxonomicInfo: Object.keys(taxonomicInfo).length > 0 ? taxonomicInfo : undefined,
                geometryType,
                coordinates,
                observationInfo: Object.keys(observationInfo).length > 0 ? observationInfo : undefined,
                collectionInfo: Object.keys(collectionInfo).length > 0 ? collectionInfo : undefined,
              })
            }
          }

          quads.forEach(({ subject, predicate, object }) => {
            addNode(subject)
            addNode(object)

            if (nodes.has(subject.value) && nodes.has(object.value)) {
              const relationshipType = classifyRelationship(predicate.value)
              links.push({
                source: subject.value,
                target: object.value,
                name: getTermName(predicate, prefixes),
                relationshipType,
              })
            }
          })

          const result: GraphData = {
            nodes: Array.from(nodes.values()),
            links,
            totalTriples: totalQuadCount,
          }

          resolve({
            data: result,
            hasMore: totalQuadCount > offset + limit,
          })
        }
      })
    })
  }
}
