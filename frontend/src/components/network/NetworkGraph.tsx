import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AccountNode } from './AccountNode';
import { NetworkControls } from './NetworkControls';
import { SelectedAccountPanel } from './SelectedAccountPanel';
import { TransactionDetailsPanel } from './TransactionDetailsPanel';
import {
  INITIAL_GRAPH_NODES,
  INITIAL_GRAPH_EDGES,
  AccountNodePayload,
  TransactionEdgePayload,
  GraphNodeDefinition,
  GraphEdgeDefinition,
} from '@/mock/networkGraphData';
import { NetworkApi } from '@/api/networkApi';

const nodeTypes = {
  accountNode: AccountNode,
};

const NetworkGraphCanvas: React.FC = () => {
  const { fitView, setCenter } = useReactFlow();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const passedAccountId = searchParams.get('id') || location.state?.targetAccountId;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');

  // Graph data state (defaults to mock, updates from backend if available)
  const [graphNodes, setGraphNodes] = useState<GraphNodeDefinition[]>(INITIAL_GRAPH_NODES);
  const [graphEdges, setGraphEdges] = useState<GraphEdgeDefinition[]>(INITIAL_GRAPH_EDGES);

  // Selected interactive items
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedAccountData, setSelectedAccountData] = useState<AccountNodePayload | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<TransactionEdgePayload | null>(null);

  // Fetch real topology from backend if connected
  useEffect(() => {
    let isCancelled = false;
    const target = passedAccountId || 'ACCT_000038';
    NetworkApi.getNetworkTopology(target).then((res) => {
      if (!isCancelled && res.data && res.data.nodes.length > 0) {
        setGraphNodes(res.data.nodes);
        setGraphEdges(res.data.edges);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [passedAccountId]);

  // Auto-focus on account if passed via navigation state
  useEffect(() => {
    if (passedAccountId) {
      const match = graphNodes.find(
        (n) => n.id === passedAccountId || n.data.accountId === passedAccountId
      );
      if (match) {
        setSelectedNodeId(match.id);
        setSelectedAccountData(match.data);
        setTimeout(() => {
          setCenter(match.position.x + 80, match.position.y + 40, { zoom: 1.15, duration: 600 });
        }, 150);
      }
    }
  }, [passedAccountId, graphNodes, setCenter]);

  // Filter raw nodes according to risk level filter
  const filteredRawNodes = useMemo(() => {
    if (selectedRiskFilter === 'all') return graphNodes;
    return graphNodes.filter(
      (n) => n.data.riskLevel.toLowerCase() === selectedRiskFilter.toLowerCase()
    );
  }, [selectedRiskFilter, graphNodes]);

  const visibleNodeIds = useMemo(() => {
    return new Set(filteredRawNodes.map((n) => n.id));
  }, [filteredRawNodes]);

  // Filter edges where both source and target exist in visible nodes
  const filteredRawEdges = useMemo(() => {
    return graphEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [visibleNodeIds, graphEdges]);

  // Compute directly connected neighbor node IDs and edge IDs when a node is selected
  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    if (!selectedNodeId) {
      return { connectedNodeIds: new Set<string>(), connectedEdgeIds: new Set<string>() };
    }
    const nodes = new Set<string>([selectedNodeId]);
    const edges = new Set<string>();

    filteredRawEdges.forEach((e) => {
      if (e.source === selectedNodeId) {
        nodes.add(e.target);
        edges.add(e.id);
      } else if (e.target === selectedNodeId) {
        nodes.add(e.source);
        edges.add(e.id);
      }
    });

    return { connectedNodeIds: nodes, connectedEdgeIds: edges };
  }, [selectedNodeId, filteredRawEdges]);

  // Prepare active nodes for React Flow with selection and dimming states
  const displayNodes: Node[] = useMemo(() => {
    return filteredRawNodes.map((n) => {
      const isSelected = n.id === selectedNodeId;
      const isConnected = connectedNodeIds.has(n.id);
      const isDimmed = Boolean(selectedNodeId && !isConnected);
      const isSearchMatch = Boolean(
        searchQuery.trim() &&
        n.data.accountId.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );

      return {
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          ...n.data,
          isSelected,
          isHighlighted: isConnected || isSearchMatch,
          isDimmed: isDimmed && !isSearchMatch,
        },
      };
    });
  }, [filteredRawNodes, selectedNodeId, connectedNodeIds, searchQuery]);

  // Prepare active edges for React Flow with thickness and highlighting
  const displayEdges: Edge[] = useMemo(() => {
    return filteredRawEdges.map((e) => {
      const isConnected = connectedEdgeIds.has(e.id);
      const isDimmed = Boolean(selectedNodeId && !isConnected);
      const isEdgeSelected = Boolean(
        selectedEdgeData &&
        selectedEdgeData.sourceAccount === e.source &&
        selectedEdgeData.targetAccount === e.target
      );

      // Stroke thickness scaled by transaction amount (e.g. ₹50k to ₹12.5L)
      const baseWidth = Math.max(1.8, Math.min(5.5, 1.8 + (e.data.amount / 350000)));
      const strokeWidth = isConnected || isEdgeSelected ? baseWidth + 1.5 : baseWidth;

      const strokeColor = isEdgeSelected
        ? '#10B981'
        : isConnected
        ? '#60A5FA'
        : '#3B82F6';

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        animated: Boolean(isConnected || isEdgeSelected),
        style: {
          stroke: strokeColor,
          strokeWidth,
          opacity: isDimmed ? 0.15 : 0.85,
          cursor: 'pointer',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: strokeColor,
        },
        data: e.data,
      };
    });
  }, [filteredRawEdges, connectedEdgeIds, selectedNodeId, selectedEdgeData]);

  // Node Click: Select node, show side panel, highlight neighbors, dim others
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedAccountData(node.data as unknown as AccountNodePayload);
    setSelectedEdgeData(null); // Clear selected edge
  }, []);

  // Edge Click: Select edge and display connection details
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeData(edge.data as unknown as TransactionEdgePayload);
  }, []);

  // Background Click: Deselect everything
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedAccountData(null);
    setSelectedEdgeData(null);
  }, []);

  // Search Action: Locate matching account node and center graph on it
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const match = filteredRawNodes.find((n) =>
        n.data.accountId.toLowerCase().includes(query.trim().toLowerCase())
      );
      if (match) {
        setSelectedNodeId(match.id);
        setSelectedAccountData(match.data);
        setCenter(match.position.x + 80, match.position.y + 40, {
          zoom: 1.15,
          duration: 600,
        });
      }
    }
  };

  // Reset Graph Action
  const handleResetGraph = useCallback(() => {
    setSearchQuery('');
    setSelectedRiskFilter('all');
    setSelectedNodeId(null);
    setSelectedAccountData(null);
    setSelectedEdgeData(null);
    setTimeout(() => {
      fitView({ padding: 0.15, duration: 600 });
    }, 50);
  }, [fitView]);

  // Fit View
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.15, duration: 500 });
  }, [fitView]);

  return (
    <div className="space-y-4">
      {/* Graph Filter & Search Controls */}
      <NetworkControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedRiskFilter={selectedRiskFilter}
        onRiskFilterChange={(level) => {
          setSelectedRiskFilter(level);
          setSelectedNodeId(null);
          setSelectedAccountData(null);
          setSelectedEdgeData(null);
        }}
        onResetGraph={handleResetGraph}
        onFitView={handleFitView}
        nodeCount={displayNodes.length}
        edgeCount={displayEdges.length}
      />

      {/* Main Graph Interactive Canvas */}
      <div className="relative h-[620px] w-full rounded-2xl border border-white/8 bg-[#0B111E] overflow-hidden shadow-2xl">
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.35}
          maxZoom={2.2}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          className="bg-[#0B111E]"
        >
          {/* Subtle Grid Dots */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="rgba(255, 255, 255, 0.08)"
          />

          {/* Interactive Navigation Controls */}
          <Controls
            className="!bg-[#0D1527] !border !border-white/10 !rounded-lg overflow-hidden [&>button]:!border-white/10 [&>button]:!bg-[#0D1527] [&>button]:!text-slate-300 [&>button:hover]:!bg-white/10 [&>button:hover]:!text-white"
            showInteractive={false}
          />

          {/* MiniMap Overview */}
          <MiniMap
            nodeColor={(n: Node) => {
              const data = n.data as unknown as AccountNodePayload;
              if (data?.riskLevel === 'High') return '#EF4444';
              if (data?.riskLevel === 'Medium') return '#F59E0B';
              return '#10B981';
            }}
            maskColor="rgba(11, 17, 30, 0.75)"
            className="!bg-[#0D1527] !border !border-white/10 !rounded-lg overflow-hidden hidden sm:block"
            zoomable
            pannable
          />
        </ReactFlow>

        {/* Selected Account Detail Side Panel (Overlay) */}
        <SelectedAccountPanel
          account={selectedAccountData}
          onClose={() => {
            setSelectedNodeId(null);
            setSelectedAccountData(null);
          }}
        />

        {/* Selected Transaction Edge Detail Panel (Overlay) */}
        <TransactionDetailsPanel
          transaction={selectedEdgeData}
          onClose={() => setSelectedEdgeData(null)}
        />

        {/* Graph Instruction Watermark / Hint */}
        <div className="absolute left-4 top-4 pointer-events-none text-[11px] text-slate-500 bg-[#0D1527]/80 px-2.5 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm hidden sm:block">
          <span>Click any account node to inspect connections &bull; Click edges for transaction details</span>
        </div>
      </div>
    </div>
  );
};

export const NetworkGraph: React.FC = () => {
  return (
    <ReactFlowProvider>
      <NetworkGraphCanvas />
    </ReactFlowProvider>
  );
};
