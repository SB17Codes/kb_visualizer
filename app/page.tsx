"use client"
import { useState, useEffect, useMemo } from "react"
import { Toaster } from "@/components/ui/toaster"
import { NavigationBreadcrumbs } from "@/components/navigation/navigation-breadcrumbs"
import { AppHeader } from "@/components/layout/app-header"
import { ProgressBar } from "@/components/layout/progress-bar"
import { EmptyState } from "@/components/layout/empty-state"
import { MainVisualization } from "@/components/visualization/main-visualization"
import { SidebarContent } from "@/components/sidebar/sidebar-content"
import { DetailTabs } from "@/components/sidebar/detail-tabs"
import { useFileProcessing } from "@/hooks/use-file-processing"
import { useDataFiltering } from "@/hooks/use-data-filtering"
import { useVirtualGraph } from "@/hooks/use-virtual-graph"
import { useGraphNavigation } from "@/hooks/use-graph-navigation"
import { getEntityCounts } from "@/lib/graph-utils"
import type { SelectedElement } from "@/lib/types"
import { MapboxViewer } from "@/components/map/mapbox-viewer"
import { MapLegend } from "@/components/map/map-legend"
import { extractGeoFeatures } from "@/lib/geo-utils"

export default function TTLVisualizerPage() {
  console.log("=== PAGE RENDER ===")

  // Custom hooks for state management
  const fileProcessing = useFileProcessing()
  const dataFiltering = useDataFiltering(fileProcessing.progressiveLoading.data)
  const virtualGraph = useVirtualGraph(fileProcessing.progressiveLoading.data)
  const navigation = useGraphNavigation(fileProcessing.progressiveLoading.data)

  // Local state
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [tripleLimit, setTripleLimit] = useState(1000)
  const [currentView, setCurrentView] = useState<"graph" | "map">("graph")

  // Memoize expensive computations to prevent unnecessary recalculations
  const entityCounts = useMemo(() => {
    console.log("Computing entity counts...")
    return getEntityCounts(fileProcessing.progressiveLoading.data)
  }, [fileProcessing.progressiveLoading.data])

  // Extract geo features immediately when data is available (not when switching to map view)
  const geoFeatures = useMemo(() => {
    if (!fileProcessing.progressiveLoading.data) {
      console.log("No data available for geo features")
      return []
    }
    console.log("Computing geo features from", fileProcessing.progressiveLoading.data.nodes.length, "nodes")
    const features = extractGeoFeatures(fileProcessing.progressiveLoading.data.nodes)
    console.log("Extracted", features.length, "geo features")
    return features
  }, [fileProcessing.progressiveLoading.data])

  const hasGeoData = geoFeatures.length > 0

  const currentNodeRelationships = useMemo(() => {
    if (!navigation.currentNode) return { incoming: [], outgoing: [] }
    console.log("Computing node relationships for:", navigation.currentNode.name)
    return navigation.getNodeRelationships(navigation.currentNode.id)
  }, [navigation.currentNode, navigation.getNodeRelationships])

  // Update selected element when navigation changes
  useEffect(() => {
    if (navigation.currentNode) {
      console.log("Navigation changed, updating selected element")
      setSelectedElement({ type: "node", data: navigation.currentNode })
    }
  }, [navigation.currentNode])

  // Event handlers - memoized to prevent unnecessary re-renders
  const handleElementSelect = useMemo(
    () => (element: SelectedElement | null) => {
      console.log("Element selected:", element?.type)
      setSelectedElement(element)
      if (element?.type === "node") {
        navigation.navigateTo(element.data)
      }
    },
    [navigation.navigateTo],
  )

  const handleNavigateToPath = useMemo(
    () => (index: number) => {
      console.log("Navigate to path:", index)
      navigation.setCurrentIndex?.(index)
    },
    [navigation.setCurrentIndex],
  )

  const handleQuickJump = useMemo(
    () => (node: any) => {
      console.log("Quick jump to:", node.name)
      navigation.navigateTo(node)
    },
    [navigation.navigateTo],
  )

  const handleLimitChange = useMemo(
    () => async (newLimit: number) => {
      console.log("Limit change requested:", newLimit)
      setTripleLimit(newLimit)
      await fileProcessing.handleLimitChange(newLimit)
    },
    [fileProcessing.handleLimitChange],
  )

  // Computed values
  const displayData = dataFiltering.filteredData || fileProcessing.progressiveLoading.data

  return (
    <>
      <Toaster />
      <div className="flex flex-col h-screen bg-muted/40 font-sans">
        <AppHeader
          tripleLimit={tripleLimit}
          onLimitChange={setTripleLimit}
          onApplyLimit={() => handleLimitChange(tripleLimit)}
          filterType={dataFiltering.filterType}
          onFilterChange={dataFiltering.handleFilterChange}
          searchTerm={dataFiltering.searchTerm}
          onSearchChange={dataFiltering.setSearchTerm}
          onSearchClear={dataFiltering.handleSearchClear}
          onSearch={dataFiltering.handleSearch}
          isDebouncing={dataFiltering.isDebouncing}
          hasData={!!fileProcessing.progressiveLoading.data}
          onUploadClick={fileProcessing.handleUploadClick}
          isLoading={fileProcessing.progressiveLoading.isLoading || fileProcessing.isUploading}
          hasMore={fileProcessing.progressiveLoading.hasMore}
          onLoadMore={fileProcessing.handleLoadMore}
          currentView={currentView}
          onViewChange={setCurrentView}
          hasGeoData={hasGeoData}
        />

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
        <ProgressBar
          isLoading={fileProcessing.progressiveLoading.isLoading}
          progress={fileProcessing.progressiveLoading.progress}
        />

        <main className="flex-1 flex p-2 gap-2 overflow-hidden min-h-0">
          <div className="flex-1 relative rounded-lg border bg-background min-w-0 overflow-hidden">
            {displayData ? (
              currentView === "graph" ? (
                <MainVisualization
                  data={displayData}
                  entityCounts={entityCounts}
                  tripleLimit={tripleLimit}
                  onElementSelect={handleElementSelect}
                  selectedId={navigation.currentNode?.id || null}
                />
              ) : (
                <>
                  <MapboxViewer
                    data={displayData}
                    selectedNodeId={navigation.currentNode?.id || null}
                    onNodeSelect={(node) => navigation.navigateTo(node)}
                    onNodeDeselect={() => setSelectedElement(null)}
                    className="w-full h-full"
                  />
                  <MapLegend
                    treesCount={geoFeatures.filter((f) => f.type === "tree").length}
                    plotsCount={geoFeatures.filter((f) => f.type === "plot").length}
                    regionsCount={geoFeatures.filter((f) => f.type === "region").length}
                  />
                </>
              )
            ) : (
              <EmptyState tripleLimit={tripleLimit} uploadError={fileProcessing.uploadError} />
            )}
          </div>

          <aside className="w-96 flex-shrink-0 overflow-hidden h-full">
            {selectedElement && fileProcessing.progressiveLoading.data ? (
              <DetailTabs
                selectedElement={selectedElement}
                data={fileProcessing.progressiveLoading.data}
                currentNode={navigation.currentNode}
                currentNodeRelationships={currentNodeRelationships}
                onNavigate={navigation.navigateTo}
                onQuickJump={handleQuickJump}
              />
            ) : (
              <SidebarContent
                data={fileProcessing.progressiveLoading.data}
                entityCounts={entityCounts}
                onQuickJump={handleQuickJump}
              />
            )}
          </aside>
        </main>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileProcessing.fileInputRef}
          onChange={fileProcessing.handleFileChange}
          className="hidden"
          accept=".ttl"
        />
      </div>
    </>
  )
}
