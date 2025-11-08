import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import MindMapNode from './MindMapNode';

interface MindMapCanvasProps {
  data: {
    nodes: Array<{
      id: string;
      label: string;
      category: string;
      description?: string;
    }>;
    edges: Array<{
      from: string;
      to: string;
    }>;
  };
}

const categoryColors = {
  root: '#1EAEDB',
  core: '#33C3F0',
  prerequisite: '#FF6B6B',
  skill: '#4ECDC4',
  resource: '#95E1D3',
  project: '#F38181',
  career: '#AA96DA',
};

const MindMapCanvas = ({ data }: MindMapCanvasProps) => {
  const nodeTypes = useMemo(() => ({ mindMapNode: MindMapNode }), []);

  // Convert data to React Flow format with automatic layout
  const initialNodes: Node[] = useMemo(() => {
    const categoryGroups: Record<string, number> = {};
    
    return data.nodes.map((node, index) => {
      const category = node.category;
      const categoryIndex = categoryGroups[category] || 0;
      categoryGroups[category] = categoryIndex + 1;

      let x = 0;
      let y = 0;

      if (category === 'root') {
        x = 400;
        y = 50;
      } else if (category === 'core') {
        x = 400 + (categoryIndex - 1) * 250 - 250;
        y = 200;
      } else if (category === 'prerequisite') {
        x = 100 + categoryIndex * 200;
        y = 350;
      } else if (category === 'skill') {
        x = 100 + categoryIndex * 180;
        y = 500;
      } else if (category === 'resource') {
        x = 100 + categoryIndex * 180;
        y = 650;
      } else if (category === 'project') {
        x = 500 + categoryIndex * 200;
        y = 500;
      } else if (category === 'career') {
        x = 600 + categoryIndex * 200;
        y = 650;
      }

      return {
        id: node.id,
        type: 'mindMapNode',
        position: { x, y },
        data: {
          label: node.label,
          category: node.category,
          description: node.description,
          color: categoryColors[category as keyof typeof categoryColors] || '#999',
        },
      };
    });
  }, [data.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#1EAEDB', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#1EAEDB',
      },
    }));
  }, [data.edges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[calc(100vh-200px)] rounded-lg border border-border overflow-hidden bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default MindMapCanvas;