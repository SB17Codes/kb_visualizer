import type * as N3 from "n3"
import { parseTTL } from "../ttl-parser"

// Web Worker for TTL parsing
self.onmessage = async (e) => {
  const { ttlString, limit, id } = e.data

  try {
    const result = await parseTTL(ttlString, limit)
    self.postMessage({ success: true, data: result, id })
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      id,
    })
  }
}

// Helper functions (copied from main parser)
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
