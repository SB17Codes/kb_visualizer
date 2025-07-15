"use client"

import type React from "react"
import { useState, useRef, useCallback, Suspense, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  TreePine,
  MapPin,
  FlaskConical,
  Database,
  BarChart3,
  ExternalLink,
  Calendar,
  User,
  Shield,
  Network,
  Map,
  Leaf,
  Navigation,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/toaster"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GraphData } from "@/lib/ttl-parser"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { useProgressiveLoading } from "@/hooks/use-progressive-loading"
import { useVirtualGraph } from "@/hooks/use-virtual-graph"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useGraphNavigation } from "@/hooks/use-graph-navigation"
import {
  getEntityCounts,
  getConnectedNodes,
  applyFilters,
  formatDateTime,
  getTaxonomicSummary,
  getSpatialSummary,
} from "@/lib/graph-utils"
import { SearchControls } from "@/components/controls/search-controls"
import { FilterControls } from "@/components/controls/filter-controls"
import { TripleLimitControls } from "@/components/controls/triple-limit-controls"
import { FileUploadControls } from "@/components/controls/file-upload-controls"
import { GraphLegend } from "@/components/graph/graph-legend"
import { GraphStats } from "@/components/graph/graph-stats"
import { RelationshipNavigator } from "@/components/navigation/relationship-navigator"
import { NavigationBreadcrumbs } from "@/components/navigation/navigation-breadcrumbs"
import { QuickJump } from "@/components/navigation/quick-jump"
import type { SelectedElement, FilterType } from "@/lib/types"

// Dynamically import the visualizer component with SSR disabled
const KnowledgeGraphVisualizer = dynamic(() => import("@/components/knowledge-graph-visualizer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4">Loading visualizer...</p>
      </div>
    </div>
  ),
})

export default function TTLVisualizerPage() {
  // State management
  const progressiveLoading = useProgressiveLoading(1000)
  const {
    value: searchTerm,
    debouncedValue: debouncedSearchTerm,
    updateValue: setSearchTerm,
    clearValue: clearSearchTerm,
    isDebouncing,
  } = useDebouncedSearch()
  const virtualGraph = useVirtualGraph(progressiveLoading.data)
  const { uploadFile, isUploading, uploadError } = useFileUpload()
  const navigation = useGraphNavigation(progressiveLoading.data)

  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [filteredData, setFilteredData] = useState<GraphData | null>(null)
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [tripleLimit, setTripleLimit] = useState(1000)
  const [currentFile, setCurrentFile] = useState<{ text: string; hash: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Generate file hash for caching
  const generateFileHash = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }, [])

  // Handle file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await uploadFile(file)
      const fileHash = await generateFileHash(file)

      setCurrentFile({ text, hash: fileHash })
      progressiveLoading.reset()
      navigation.clearHistory()
      await progressiveLoading.loadData(text, fileHash, true)

      toast({
        title: "File Processed Successfully",
        description: `Loaded ${progressiveLoading.data?.nodes.length || 0} nodes and ${progressiveLoading.data?.links.length || 0} links.`,
      })
    } catch (error) {
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      })
    }
  }

  // Apply filters when data or search changes
  useEffect(() => {
    if (progressiveLoading.data) {
      const filtered = applyFilters(progressiveLoading.data, filterType, debouncedSearchTerm)
      setFilteredData(filtered)
    }
  }, [progressiveLoading.data, filterType, debouncedSearchTerm])

  // Update selected element when navigation changes
  useEffect(() => {
    if (navigation.currentNode) {
      setSelectedElement({ type: "node", data: navigation.currentNode })
    }
  }, [navigation.currentNode])

  // Event handlers
  const handleUploadClick = () => fileInputRef.current?.click()

  const handleSearch = useCallback(() => {
    if (!progressiveLoading.data) return
    const filtered = applyFilters(progressiveLoading.data, filterType, searchTerm)
    setFilteredData(filtered)
  }, [searchTerm, filterType, progressiveLoading.data])

  const handleFilterChange = (newFilter: FilterType) => {
    setFilterType(newFilter)
  }

  const handleSearchClear = () => {
    setSearchTerm("")
    clearSearchTerm()
  }

  const handleLimitChange = async (newLimit: number) => {
    setTripleLimit(newLimit)
    if (currentFile) {
      progressiveLoading.reset()
      navigation.clearHistory()
      await progressiveLoading.loadData(currentFile.text, currentFile.hash, true)
    }
  }

  const handleLoadMore = useCallback(async () => {
    if (currentFile) {
      await progressiveLoading.loadMore(currentFile.text, currentFile.hash)
    }
  }, [progressiveLoading, currentFile])

  // Navigation handlers
  const handleElementSelect = (element: SelectedElement | null) => {
    setSelectedElement(element)
    if (element?.type === "node") {
      navigation.navigateTo(element.data)
    }
  }

  const handleNavigateToPath = (index: number) => {
    navigation.setCurrentIndex?.(index)
  }

  const handleQuickJump = (node: any) => {
    navigation.navigateTo(node)
  }

  // Helper functions
  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "tree":
        return <TreePine className="w-4 h-4" />
      case "plot":
        return <Map className="w-4 h-4" />
      case "region":
        return <MapPin className="w-4 h-4" />
      case "observation":
        return <FlaskConical className="w-4 h-4" />
      case "observationCollection":
        return <Database className="w-4 h-4" />
      case "result":
        return <BarChart3 className="w-4 h-4" />
      default:
        return null
    }
  }

  // Data summaries
  const entityCounts = getEntityCounts(progressiveLoading.data)
  const taxonomicSummary = progressiveLoading.data ? getTaxonomicSummary(progressiveLoading.data) : {}
  const spatialSummary = progressiveLoading.data ? getSpatialSummary(progressiveLoading.data) : {}
  const displayData = filteredData || progressiveLoading.data

  // Get relationships for current node
  const currentNodeRelationships = navigation.currentNode
    ? navigation.getNodeRelationships(navigation.currentNode.id)
    : { incoming: [], outgoing: [] }

  // Render detail panel
  const renderDetail = (element: SelectedElement) => {
    const { type, data } = element

    if (type === "node") {
      const connections = displayData ? getConnectedNodes(data.id, displayData) : []

      return (
        <div className="h-full flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getEntityIcon(data.entityType)}
                {data.entityType === "tree"
                  ? "Tree"
                  : data.entityType === "plot"
                    ? "Forest Plot"
                    : data.entityType === "region"
                      ? "Region"
                      : data.entityType === "observation"
                        ? "Observation"
                        : data.entityType === "observationCollection"
                          ? "Collection"
                          : data.entityType === "result"
                            ? "Result"
                            : "Node"}
              </CardTitle>
              <CardDescription className="break-words text-sm font-medium">{data.name}</CardDescription>
              {data.entityType && (
                <Badge variant="outline" className="w-fit capitalize">
                  {data.entityType}
                </Badge>
              )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-4 text-sm">
              {/* Connected Nodes Section */}
              {connections.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-semibold">Connected Entities ({connections.length})</h4>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {connections.map((connection, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs p-2 bg-background rounded border cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          const targetNode = progressiveLoading.data?.nodes.find((n) => n.id === connection.node.id)
                          if (targetNode) {
                            navigation.navigateTo(targetNode, connection.relationship, connection.direction)
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getEntityIcon(connection.node.entityType)}
                          <span className="font-medium truncate">{connection.node.name}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {connection.relationship}
                          </Badge>
                          <span
                            className={`text-xs ${connection.direction === "outgoing" ? "text-blue-600" : "text-green-600"}`}
                          >
                            {connection.direction === "outgoing" ? "→" : "←"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Taxonomic Information */}
              {data.taxonomicInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold">Taxonomic Classification</h4>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {Object.entries(data.taxonomicInfo).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-muted-foreground capitalize font-medium">{key.replace("dwc:", "")}:</span>
                        <span className="font-semibold text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spatial Information */}
              {data.geometryType && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold">Spatial Information</h4>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Geometry Type:</span>
                      <Badge variant="secondary">{data.geometryType}</Badge>
                    </div>
                    {data.coordinates && (
                      <div>
                        <span className="text-muted-foreground font-medium">Coordinates:</span>
                        <p className="font-mono text-xs mt-1 p-2 bg-background rounded border break-all">
                          {data.coordinates}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plot Information */}
              {data.plotInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold">Plot Information</h4>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {Object.entries(data.plotInfo).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-muted-foreground capitalize font-medium">{key}:</span>
                        <Badge variant="outline">{value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observation Data */}
              {data.observationInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold">Observation Data</h4>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                    {Object.entries(data.observationInfo).map(([key, value]) => (
                      <div key={key}>
                        {key === "resultTime" ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground font-medium">Result Time:</span>
                            <span className="font-semibold">{formatDateTime(String(value))}</span>
                          </div>
                        ) : key === "numericValue" ? (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-medium">Numeric Value:</span>
                            <Badge variant="default" className="font-mono">
                              {value}
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground capitalize font-medium">
                              {key.replace(/([A-Z])/g, " $1")}:
                            </span>
                            <span className="font-semibold text-right">{String(value)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Information */}
              {data.collectionInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-violet-600" />
                    <h4 className="font-semibold">Collection Information</h4>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                    {Object.entries(data.collectionInfo).map(([key, value]) => (
                      <div key={key}>
                        {key === "creator" ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground font-medium">Creator:</span>
                            <span className="font-semibold">{String(value)}</span>
                          </div>
                        ) : key === "license" ? (
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground font-medium">License:</span>
                            <Badge variant="outline">{String(value)}</Badge>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground capitalize font-medium">
                              {key.replace(/([A-Z])/g, " $1")}:
                            </span>
                            <span className="font-semibold text-right">{String(value)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Technical Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                  <h4 className="font-semibold">Technical Details</h4>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div>
                    <span className="text-muted-foreground font-medium">URI:</span>
                    <p className="font-mono text-xs mt-1 p-2 bg-background rounded border break-all select-all">
                      {data.id}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">RDF Type:</span>
                    <Badge variant="outline">{data.type}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    } else {
      return (
        <div className="h-full flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Relationship Details</CardTitle>
              <CardDescription className="break-words text-sm">Connection between entities</CardDescription>
              {data.relationshipType && (
                <Badge variant="outline" className="w-fit capitalize">
                  {data.relationshipType}
                </Badge>
              )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-4 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold">Predicate</h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <Badge variant="secondary" className="font-mono">
                    {data.name}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Connection</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                  <div>
                    <span className="text-muted-foreground font-medium">Source:</span>
                    <p className="font-semibold mt-1 break-all">
                      {typeof data.source === "object" ? data.source.name : data.source}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-8 h-px bg-border relative">
                      <div className="absolute right-0 top-0 w-0 h-0 border-l-4 border-l-border border-t-2 border-b-2 border-t-transparent border-b-transparent transform -translate-y-1/2"></div>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Target:</span>
                    <p className="font-semibold mt-1 break-all">
                      {typeof data.target === "object" ? data.target.name : data.target}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Technical Details</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div>
                    <span className="text-muted-foreground font-medium">Source URI:</span>
                    <p className="font-mono text-xs mt-1 p-2 bg-background rounded border break-all select-all">
                      {typeof data.source === "object" ? data.source.id : data.source}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Target URI:</span>
                    <p className="font-mono text-xs mt-1 p-2 bg-background rounded border break-all select-all">
                      {typeof data.target === "object" ? data.target.id : data.target}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return (
    <>
      <Toaster />
      <div className="flex flex-col h-screen bg-muted/40 font-sans">
        <header className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
          <h1 className="text-xl font-bold">OneForestKB Visualizer</h1>
          <div className="flex items-center gap-2">
            <TripleLimitControls
              tripleLimit={tripleLimit}
              onLimitChange={setTripleLimit}
              onApply={() => handleLimitChange(tripleLimit)}
              disabled={!progressiveLoading.data || progressiveLoading.isLoading}
            />
            <FilterControls filterType={filterType} onFilterChange={handleFilterChange} />
            <SearchControls
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearchClear={handleSearchClear}
              onSearch={handleSearch}
              isDebouncing={isDebouncing}
              disabled={!progressiveLoading.data}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".ttl" />
            <FileUploadControls
              onUploadClick={handleUploadClick}
              isLoading={progressiveLoading.isLoading || isUploading}
              hasMore={progressiveLoading.hasMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </header>

        {/* Navigation Breadcrumbs */}
        {navigation.breadcrumbs.length > 0 && (
          <div className="px-4 py-2 bg-background border-b">
            <NavigationBreadcrumbs
              breadcrumbs={navigation.breadcrumbs}
              canGoBack={navigation.canGoBack}
              canGoForward={navigation.canGoForward}
              onGoBack={navigation.goBack}
              onGoForward={navigation.goForward}
              onClearHistory={navigation.clearHistory}
              onNavigateToPath={handleNavigateToPath}
            />
          </div>
        )}

        {/* Progress Bar */}
        {progressiveLoading.isLoading && progressiveLoading.progress > 0 && (
          <div className="px-4 py-2 bg-background border-b">
            <div className="flex items-center gap-2 text-sm">
              <span>Processing:</span>
              <Progress value={progressiveLoading.progress} className="flex-1" />
              <span>{progressiveLoading.progress}%</span>
            </div>
          </div>
        )}

        <main className="flex-1 flex p-2 gap-2 overflow-hidden min-h-0">
          <div className="flex-1 relative rounded-lg border bg-background min-w-0 overflow-hidden">
            {displayData ? (
              <>
                <GraphStats
                  data={displayData}
                  filteredNodeCount={displayData.nodes.length}
                  filteredLinkCount={displayData.links.length}
                  tripleLimit={tripleLimit}
                />
                <GraphLegend entityCounts={entityCounts} />
                <div className="w-full h-full">
                  <Suspense
                    fallback={
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                          <p className="mt-4">Loading visualizer...</p>
                        </div>
                      </div>
                    }
                  >
                    <KnowledgeGraphVisualizer
                      data={displayData}
                      onElementSelect={handleElementSelect}
                      selectedId={navigation.currentNode?.id || null}
                    />
                  </Suspense>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <TreePine className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-semibold">Upload a Forest Knowledge Graph</h2>
                <p>
                  Upload a Turtle (.ttl) file to visualize forest data with trees, plots, and taxonomic information.
                </p>
                <p className="mt-2 text-sm">Current limit: {tripleLimit} triples</p>
                {uploadError && <p className="mt-4 text-red-500">{uploadError}</p>}
              </div>
            )}
          </div>

          <aside className="w-96 flex-shrink-0 overflow-hidden h-full">
            {selectedElement && progressiveLoading.data ? (
              <Tabs defaultValue="details" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="navigate">Navigate</TabsTrigger>
                  <TabsTrigger value="jump">Jump</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="flex-1 overflow-hidden">
                  {renderDetail(selectedElement)}
                </TabsContent>

                <TabsContent value="navigate" className="flex-1 overflow-hidden">
                  {navigation.currentNode && (
                    <RelationshipNavigator
                      node={navigation.currentNode}
                      relationships={currentNodeRelationships}
                      onNavigate={navigation.navigateTo}
                    />
                  )}
                </TabsContent>

                <TabsContent value="jump" className="flex-1 overflow-hidden">
                  <QuickJump data={progressiveLoading.data} onJumpTo={handleQuickJump} />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    RDF Navigator
                  </CardTitle>
                  <CardDescription>Click on a node to start navigating relationships.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <p className="text-sm text-muted-foreground mb-4">No element selected.</p>
                  {progressiveLoading.data && (
                    <div className="space-y-4">
                      <QuickJump data={progressiveLoading.data} onJumpTo={handleQuickJump} />

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-3">Entity Summary</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <TreePine className="w-4 h-4 text-green-600" />
                              <span>Trees:</span>
                            </div>
                            <Badge variant="secondary">{entityCounts.trees}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <Map className="w-4 h-4 text-blue-600" />
                              <span>Plots:</span>
                            </div>
                            <Badge variant="secondary">{entityCounts.plots}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-indigo-600" />
                              <span>Regions:</span>
                            </div>
                            <Badge variant="secondary">{entityCounts.regions}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="w-4 h-4 text-purple-600" />
                              <span>Observations:</span>
                            </div>
                            <Badge variant="secondary">{entityCounts.observations}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-violet-600" />
                              <span>Collections:</span>
                            </div>
                            <Badge variant="secondary">{entityCounts.collections}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-pink-600" />
                              <span>Results:</span>
                            </div>
                            <Badge variant="secondary">{entityCounts.results}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </aside>
        </main>
      </div>
    </>
  )
}
