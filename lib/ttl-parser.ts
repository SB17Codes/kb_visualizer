import * as N3 from "n3"

export interface GraphNode extends N3.Quad_Subject {
  id: string
  name: string
  type: "uri" | "literal" | "blank"
  entityType?: "tree" | "region" | "observation" | "observationCollection" | "result" | "plot"
  taxonomicInfo?: Record<string, string>
  geometryType?: string
  coordinates?: string
  observationInfo?: Record<string, string>
  collectionInfo?: Record<string, string>
  plotInfo?: Record<string, string>
  val?: number
  x?: number
  y?: number
}

export interface GraphLink {
  source: string
  target: string
  name: string
  relationshipType?: "spatial" | "taxonomic" | "observational" | "temporal" | "containment"
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  totalTriples?: number
}

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
): "tree" | "region" | "observation" | "observationCollection" | "result" | "plot" | undefined {
  // Check for observation collection
  if (types.has("http://www.w3.org/ns/sosa/ObservationCollection")) {
    return "observationCollection"
  }

  // Check for observation result
  if (types.has("http://www.w3.org/ns/sosa/Result")) {
    return "result"
  }

  // Check for observation
  if (types.has("http://www.w3.org/ns/sosa/Observation")) {
    return "observation"
  }

  // Check for tree (gemet:8664 indicates tree concept)
  if (types.has("http://www.eionet.europa.eu/gemet/concept/8664")) {
    return "tree"
  }

  // Check for forest plot (BAFOG pattern in URI)
  if (uri.includes("BAFOG")) {
    return "plot"
  }

  // Check for region (geo:Feature but not tree or plot)
  if (types.has("http://www.opengis.net/ont/geosparql#Feature")) {
    return "region"
  }

  // Check for geometry objects - don't show as separate nodes
  if (types.has("http://www.opengis.net/ont/sf#Point") || types.has("http://www.opengis.net/ont/sf#Polygon")) {
    return undefined
  }

  return undefined
}

function classifyRelationship(
  predicate: string,
): "spatial" | "taxonomic" | "observational" | "temporal" | "containment" | undefined {
  if (predicate.includes("hasGeometry")) {
    return "spatial"
  }
  if (predicate.includes("sfWithin")) {
    return "containment"
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

export function parseTTL(ttlString: string, limit = 1000): Promise<GraphData> {
  return new Promise((resolve, reject) => {
    const parser = new N3.Parser()
    const quads: N3.Quad[] = []
    const nodes = new Map<string, GraphNode>()
    const links: GraphLink[] = []
    const entityTypes = new Map<string, Set<string>>()
    const entityProperties = new Map<string, any[]>()
    let prefixes: N3.Prefixes = {}
    let totalQuadCount = 0

    parser.parse(ttlString, (error, quad, p) => {
      if (error) {
        console.error("TTL parsing error:", error)
        return reject(error)
      }

      if (quad) {
        totalQuadCount++
        if (quads.length < limit) {
          quads.push(quad)

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
        }
      } else {
        // Parsing complete
        prefixes = p || {}

        try {
          const addNode = (term: N3.Term) => {
            if (!nodes.has(term.value)) {
              let type: "uri" | "literal" | "blank" = "uri"
              if (term.termType === "Literal") type = "literal"
              if (term.termType === "BlankNode") type = "blank"

              const entityType = classifyEntity(term.value, entityTypes.get(term.value) || new Set(), entityProperties)

              // Skip geometry objects
              if (
                entityType === undefined &&
                (entityTypes.get(term.value)?.has("http://www.opengis.net/ont/sf#Point") ||
                  entityTypes.get(term.value)?.has("http://www.opengis.net/ont/sf#Polygon"))
              ) {
                return
              }

              const props = entityProperties.get(term.value) || []

              // Extract taxonomic information
              const taxonomicInfo: Record<string, string> = {}
              props.forEach((prop) => {
                if (prop.predicate.startsWith("http://rs.tdwg.org/dwc/terms/")) {
                  const key = prop.predicate.split("/").pop() || prop.predicate
                  taxonomicInfo[`dwc:${key}`] = prop.object.value
                }
              })

              // Extract geometry information
              let geometryType: string | undefined
              let coordinates: string | undefined
              props.forEach((prop) => {
                if (prop.predicate === "http://www.opengis.net/ont/geosparql#asWKT") {
                  const wkt = prop.object.value
                  if (wkt.startsWith("POINT")) {
                    geometryType = "Point"
                    const coordMatch = wkt.match(/POINT$$([^)]+)$$/)
                    coordinates = coordMatch?.[1]
                  } else if (wkt.startsWith("POLYGON")) {
                    geometryType = "Polygon"
                    coordinates = "Polygon coordinates"
                  }
                }
              })

              // Extract plot information for BAFOG plots
              const plotInfo: Record<string, string> = {}
              if (entityType === "plot") {
                const plotName = getTermName(term, prefixes)
                const regionMatch = plotName.match(/BAFOG_([IVX]+)_(\d+)/)
                if (regionMatch) {
                  plotInfo.region = `BAFOG_${regionMatch[1]}`
                  plotInfo.plotNumber = regionMatch[2]
                }
              }

              // Extract observation information
              const observationInfo: Record<string, string> = {}
              props.forEach((prop) => {
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
              })

              // Extract collection information
              const collectionInfo: Record<string, string> = {}
              props.forEach((prop) => {
                if (prop.predicate === "http://purl.org/dc/terms/creator") {
                  collectionInfo.creator = prop.object.value
                }
                if (prop.predicate === "http://creativecommons.org/ns#license") {
                  collectionInfo.license = getTermName(prop.object, prefixes)
                }
                if (prop.predicate === "http://qudt.org/schema/qudt/unit") {
                  collectionInfo.unit = getTermName(prop.object, prefixes)
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
                plotInfo: Object.keys(plotInfo).length > 0 ? plotInfo : undefined,
              })
            }
          }

          quads.forEach(({ subject, predicate, object }) => {
            addNode(subject)
            addNode(object)

            // Only add links between nodes that exist
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

          const result = {
            nodes: Array.from(nodes.values()),
            links,
            totalTriples: totalQuadCount,
          }

          console.log(
            `Parsed ${result.nodes.length} nodes and ${result.links.length} links from ${totalQuadCount} triples`,
          )
          resolve(result)
        } catch (processingError) {
          console.error("Error processing parsed data:", processingError)
          reject(processingError)
        }
      }
    })
  })
}
