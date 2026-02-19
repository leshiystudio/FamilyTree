import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  NodeTypes,
  EdgeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X, Eye, User, Calendar } from 'lucide-react';

// Custom node component
const FamilyNode = ({ data }) => {
  return (
    <div className="relative p-3 rounded-lg shadow-md bg-white">
      <div className="flex items-start gap-2">
        {data.photoUrl ? (
          <img src={data.photoUrl} alt="Фото" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={24} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-text truncate">{data.name}</h4>
          <div className="flex items-center gap-2 text-xs text-text-light mt-1">
            {data.birthDate && (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {data.birthDate}
              </span>
            )}
            {data.gender && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${data.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                {data.gender === 'male' ? 'Муж' : 'Жен'}
              </span>
            )}
          </div>
        </div>
      </div>
      {data.description && (
        <p className="mt-2 text-xs text-text-light line-clamp-2">{data.description}</p>
      )}
    </div>
  );
};

// Node types configuration
const nodeTypes = {
  familyNode: FamilyNode,
};

const TreeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [treeName, setTreeName] = useState('');
  const [treeDescription, setTreeDescription] = useState('');
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  // Fetch tree data
  const fetchTreeData = useCallback(async () => {
    try {
      const [treeResponse, nodesResponse, relationshipsResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/trees/${id}`),
        fetch(`http://localhost:5000/api/nodes/tree/${id}`),
        fetch(`http://localhost:5000/api/relationships/tree/${id}`)
      ]);

      const treeData = await treeResponse.json();
      const nodesData = await nodesResponse.json();
      const relationshipsData = await relationshipsResponse.json();

      setTreeName(treeData.name || '');
      setTreeDescription(treeData.description || '');

      // Convert nodes to ReactFlow format
      const flowNodes = nodesData.map((node) => ({
        id: node.id.toString(),
        type: 'familyNode',
        position: { x: node.x_position || 0, y: node.y_position || 0 },
        data: {
          ...node,
          isEditing: false
        }
      }));

      // Convert relationships to ReactFlow edges
      const flowEdges = relationshipsData.map((rel) => ({
        id: rel.id.toString(),
        source: rel.source_node_id.toString(),
        target: rel.target_node_id.toString(),
        type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        label: rel.relationship_type
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error fetching tree data:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-text-light hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text">{treeName}</h1>
            {treeDescription && (
              <p className="text-sm text-text-light">{treeDescription}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/tree/${id}/edit`)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Eye size={18} />
            <span>Редактировать</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.Bezier}
          fitView
          className="bg-background"
          panOnDrag={true}
          zoomOnScroll={true}
          panOnScroll={true}
        >
          <Background />
          <MiniMap />
          <Controls className="bg-white rounded-lg shadow-md" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TreeView;