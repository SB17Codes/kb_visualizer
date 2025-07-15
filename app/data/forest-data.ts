export type AbundanceData = {
  family: string
  value: number
  fill: string
}

export type SiteData = {
  id: string
  name: string
  description: string
  stats: {
    species: number
    trees: number
    unknownSpecies: number
  }
  validation: {
    errors: number
  }
  abundance: AbundanceData[]
  mapQuery: string
}

const colors = [
  "var(--color-fabaceae)",
  "var(--color-arecaceae)",
  "var(--color-lecythidaceae)",
  "var(--color-sapotaceae)",
  "var(--color-chrysobalanaceae)",
  "var(--color-burseraceae)",
  "var(--color-euphorbiaceae)",
  "var(--color-annonaceae)",
  "var(--color-myristicaceae)",
  "var(--color-vochysiaceae)",
]

export const forestData: Record<string, SiteData> = {
  BAFOG_I: {
    id: "BAFOG_I",
    name: "BAFOG Site I",
    description:
      "The first experimental site in the BAFOG living lab, characterized by a high presence of Fabaceae and Arecaceae families.",
    stats: { species: 133, trees: 3744, unknownSpecies: 7 },
    validation: { errors: 32 },
    abundance: [
      { family: "Fabaceae", value: 25.1, fill: colors[0] },
      { family: "Arecaceae", value: 24.3, fill: colors[1] },
      { family: "Lecythidaceae", value: 7.2, fill: colors[2] },
      { family: "Sapotaceae", value: 6.5, fill: colors[3] },
      { family: "Chrysobalanaceae", value: 5.0, fill: colors[4] },
      { family: "Burseraceae", value: 4.1, fill: colors[5] },
      { family: "Euphorbiaceae", value: 3.4, fill: colors[6] },
      { family: "Annonaceae", value: 3.1, fill: colors[7] },
      { family: "Myristicaceae", value: 2.8, fill: colors[8] },
      { family: "Vochysiaceae", value: 2.2, fill: colors[9] },
    ],
    mapQuery:
      "map of BAFOG_I forest plot in French Guiana with tree locations marked as green dots and 32 red outlier dots near the border",
  },
  BAFOG_II: {
    id: "BAFOG_II",
    name: "BAFOG Site II",
    description:
      "The second site, showing a more distributed species abundance, though still dominated by the Fabaceae family.",
    stats: { species: 163, trees: 3271, unknownSpecies: 4 },
    validation: { errors: 158 },
    abundance: [
      { family: "Fabaceae", value: 22.5, fill: colors[0] },
      { family: "Lecythidaceae", value: 8.1, fill: colors[2] },
      { family: "Chrysobalanaceae", value: 7.4, fill: colors[4] },
      { family: "Sapotaceae", value: 6.9, fill: colors[3] },
      { family: "Burseraceae", value: 5.5, fill: colors[5] },
      { family: "Meliaceae", value: 4.3, fill: "var(--color-meliaceae)" },
      { family: "Annonaceae", value: 3.9, fill: colors[7] },
      { family: "Lauraceae", value: 3.5, fill: "var(--color-lauraceae)" },
      { family: "Myristicaceae", value: 3.1, fill: colors[8] },
      { family: "Vochysiaceae", value: 2.8, fill: colors[9] },
    ],
    mapQuery:
      "map of BAFOG_II forest plot in French Guiana with tree locations marked as green dots and 158 red outlier dots near the border",
  },
  BAFOG_III: {
    id: "BAFOG_III",
    name: "BAFOG Site III",
    description:
      "This site exhibits greater species diversity compared to others, with Lecythidaceae being the most abundant family.",
    stats: { species: 144, trees: 4098, unknownSpecies: 6 },
    validation: { errors: 38 },
    abundance: [
      { family: "Lecythidaceae", value: 12.3, fill: colors[2] },
      { family: "Fabaceae", value: 10.8, fill: colors[0] },
      { family: "Sapotaceae", value: 8.5, fill: colors[3] },
      { family: "Chrysobalanaceae", value: 7.9, fill: colors[4] },
      { family: "Burseraceae", value: 6.2, fill: colors[5] },
      { family: "Euphorbiaceae", value: 5.1, fill: colors[6] },
      { family: "Myristicaceae", value: 4.7, fill: colors[8] },
      { family: "Annonaceae", value: 4.2, fill: colors[7] },
      { family: "Meliaceae", value: 3.8, fill: "var(--color-meliaceae)" },
      { family: "Lauraceae", value: 3.3, fill: "var(--color-lauraceae)" },
    ],
    mapQuery:
      "map of BAFOG_III forest plot in French Guiana with tree locations marked as green dots and 38 red outlier dots near the border",
  },
  BAFOG_IV: {
    id: "BAFOG_IV",
    name: "BAFOG Site IV",
    description:
      "The fourth site, where 40% of trees are concentrated in just four families, indicating a different ecological balance.",
    stats: { species: 183, trees: 3429, unknownSpecies: 2 },
    validation: { errors: 50 },
    abundance: [
      { family: "Myristicaceae", value: 11.2, fill: colors[8] },
      { family: "Lecythidaceae", value: 10.5, fill: colors[2] },
      { family: "Fabaceae", value: 10.1, fill: colors[0] },
      { family: "Burseraceae", value: 9.3, fill: colors[5] },
      { family: "Sapotaceae", value: 7.8, fill: colors[3] },
      { family: "Chrysobalanaceae", value: 6.4, fill: colors[4] },
      { family: "Annonaceae", value: 5.5, fill: colors[7] },
      { family: "Lauraceae", value: 4.9, fill: "var(--color-lauraceae)" },
      { family: "Meliaceae", value: 4.1, fill: "var(--color-meliaceae)" },
      { family: "Vochysiaceae", value: 3.9, fill: colors[9] },
    ],
    mapQuery:
      "map of BAFOG_IV forest plot in French Guiana with tree locations marked as green dots and 50 red outlier dots near the border",
  },
}

// Sample forest data for testing and demonstration
export const sampleForestData = `
@prefix gemet: <http://www.eionet.europa.eu/gemet/concept/> .
@prefix geo: <http://www.opengis.net/ont/geosparql#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://purl.org/guyafor#tree1> a gemet:8664, geo:Feature;
  <http://rs.tdwg.org/dwc/terms/family> "Fabaceae";
  <http://rs.tdwg.org/dwc/terms/genus> "Macrolobium";
  <http://rs.tdwg.org/dwc/terms/specificEpithet> "bifolium";
  geo:hasGeometry <http://purl.org/guyafor#tree1_g>;
  geo:sfWithin <http://purl.org/guyafor#BAFOG_I_62> .

<http://purl.org/guyafor#tree1_g> a <http://www.opengis.net/ont/sf#Point>;
  geo:asWKT "POINT(-53.97515488 5.486866474)"^^geo:wktLiteral .

<http://purl.org/guyafor#BAFOG_I_62> a geo:Feature;
  rdfs:label "BAFOG Plot I-62" .
`
