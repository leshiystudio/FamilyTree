import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Trash2, Save, Undo, Redo, Eye, X, Info, Calendar, User, FileText, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// Custom node component
const FamilyNode = ({ data }) => {
  const isEditing = data.isEditing || false;
  
  return (
    <div className={`relative p-3 rounded-lg shadow-md transition-all duration-200 ${isEditing ? 'ring-2 ring-primary' : ''}`}>
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

const TreeEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [treeName, setTreeName] = useState('');
  const [treeDescription, setTreeDescription] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isViewMode, setIsViewMode] = useState(false);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [nodeFormData, setNodeFormData] = useState({
    name: '',
    photoUrl: '',
    birthDate: '',
    gender: 'male',
    description: ''
  });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connectionSource, setConnectionSource] = useState(null);
  const [connectionPosition, setConnectionPosition] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);

  const reactFlowWrapper = useRef(null);

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
      showToast('Ошибка загрузки данных', 'error');
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // Save tree data
  const saveTreeData = useCallback(async () => {
    try {
      // Update tree info
      await fetch(`http://localhost:5000/api/trees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: treeName,
          description: treeDescription
        })
      });

      // Update nodes
      for (const node of nodes) {
        await fetch(`http://localhost:5000/api/nodes/${node.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: node.data.name,
            photoUrl: node.data.photoUrl,
            birthDate: node.data.birthDate,
            gender: node.data.gender,
            description: node.data.description,
            xPosition: node.position.x,
            yPosition: node.position.y
          })
        });
      }

      // Update edges
      for (const edge of edges) {
        await fetch(`http://localhost:5000/api/relationships/${edge.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            relationshipType: edge.label || 'родственник'
          })
        });
      }

      showToast('Данные сохранены', 'success');
    } catch (error) {
      console.error('Error saving tree data:', error);
      showToast('Ошибка сохранения', 'error');
    }
  }, [id, treeName, treeDescription, nodes, edges, showToast]);

  // Add node
  const addNode = async (position) => {
    try {
      const newNode = {
        id: Date.now().toString(),
        type: 'familyNode',
        position,
        data: {
          ...nodeFormData,
          isEditing: false
        }
      };

      // Save to database
      const response = await fetch('http://localhost:5000/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treeId: id,
          name: nodeFormData.name,
          photoUrl: nodeFormData.photoUrl,
          birthDate: nodeFormData.birthDate,
          gender: nodeFormData.gender,
          description: nodeFormData.description,
          xPosition: position.x,
          yPosition: position.y
        })
      });

      const savedNode = await response.json();
      
      // Update node with database ID
      const updatedNode = {
        ...newNode,
        id: savedNode.id.toString(),
        data: {
          ...savedNode,
          isEditing: false
        }
      };

      setNodes((nds) => [...nds, updatedNode]);
      showToast('Узел добавлен', 'success');
      setShowNodeForm(false);
      setNodeFormData({ name: '', photoUrl: '', birthDate: '', gender: 'male', description: '' });
    } catch (error) {
      console.error('Error adding node:', error);
      showToast('Ошибка добавления узла', 'error');
    }
  };

  // Delete node
  const deleteNode = async (nodeId) => {
    try {
      await fetch(`http://localhost:5000/api/nodes/${nodeId}`, {
        method: 'DELETE'
      });
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      showToast('Узел удален', 'success');
    } catch (error) {
      console.error('Error deleting node:', error);
      showToast('Ошибка удаления узла', 'error');
    }
  };

  // Delete edge
  const deleteEdge = async (edgeId) => {
    try {
      await fetch(`http://localhost:5000/api/relationships/${edgeId}`, {
        method: 'DELETE'
      });
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      showToast('Связь удалена', 'success');
    } catch (error) {
      console.error('Error deleting edge:', error);
      showToast('Ошибка удаления связи', 'error');
    }
  };

  // Connect nodes
  const handleConnect = (params) => {
    if (connectionSource && connectionSource !== params.target) {
      const newEdge = {
        id: `${connectionSource}-${params.target}`,
        source: connectionSource,
        target: params.target,
        type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        label: 'родственник'
      };
      setEdges((eds) => [...eds, newEdge]);
      setConnectionSource(null);
      showToast('Связь создана', 'success');
    }
  };

  // Handle connection start
  const handleConnectionStart = (nodeId) => {
    setConnectionSource(nodeId);
  };

  // Handle connection end
  const handleConnectionEnd = () => {
    setConnectionSource(null);
  };

  // Handle node click
  const handleNodeClick = (_, node) => {
    if (isViewMode) return;
    
    if (connectionSource) {
      handleConnect({ source: connectionSource, target: node.id });
    } else {
      setEditingNode(node);
      setNodeFormData({
        name: node.data.name || '',
        photoUrl: node.data.photoUrl || '',
        birthDate: node.data.birthDate || '',
        gender: node.data.gender || 'male',
        description: node.data.description || ''
      });
      setShowNodeForm(true);
    }
  };

  // Handle edge click
  const handleEdgeClick = (_, edge) => {
    if (isViewMode) return;
    deleteEdge(edge.id);
  };

  // Handle connection line
  const handleConnectStart = (_, nodeId) => {
    handleConnectionStart(nodeId);
  };

  // Handle connection end
  const handleConnectEnd = (event) => {
    const target = event.target;
    if (target && target.classList.contains('react-flow-node')) {
      const nodeElement = target.closest('.react-flow-node');
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        if (nodeId && connectionSource && connectionSource !== nodeId) {
          handleConnect({ source: connectionSource, target: nodeId });
        }
      }
    }
    handleConnectionEnd();
  };

  // Undo/Redo
  const saveToHistory = () => {
    const historyEntry = [nodes, edges];
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(historyEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setNodes(previousState[0]);
      setEdges(previousState[1]);
      setHistoryIndex(historyIndex - 1);
      showToast('Отменено', 'success');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState[0]);
      setEdges(nextState[1]);
      setHistoryIndex(historyIndex + 1);
      showToast('Повторено', 'success');
    }
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (editingNode) {
      // Update existing node
      const updatedNode = {
        ...editingNode,
        data: {
          ...editingNode.data,
          ...nodeFormData,
          isEditing: false
        }
      };
      setNodes((nds) => nds.map((n) => n.id === editingNode.id ? updatedNode : n));
      
      // Save to database
      try {
        await fetch(`http://localhost:5000/api/nodes/${editingNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nodeFormData.name,
            photoUrl: nodeFormData.photoUrl,
            birthDate: nodeFormData.birthDate,
            gender: nodeFormData.gender,
            description: nodeFormData.description,
            xPosition: updatedNode.position.x,
            yPosition: updatedNode.position.y
          })
        });
        showToast('Узел обновлен', 'success');
      } catch (error) {
        console.error('Error updating node:', error);
        showToast('Ошибка обновления узла', 'error');
      }
    } else {
      // Add new node
      const position = { x: 0, y: 0 };
      await addNode(position);
    }
    setShowNodeForm(false);
    setEditingNode(null);
  };

  // Handle node drag
  const handleNodeDrag = (_, node) => {
    if (connectionSource) {
      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      if (rect) {
        setConnectionPosition({
          x: node.position.x + 100,
          y: node.position.y + 50
        });
      }
    }
  };

  // Handle pane click
  const handlePaneClick = (event) => {
    if (event.target === event.currentTarget && !isViewMode) {
      setShowNodeForm(true);
      setEditingNode(null);
      setNodeFormData({ name: '', photoUrl: '', birthDate: '', gender: 'male', description: '' });
    }
  };

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
            <input
              type="text"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              disabled={isViewMode}
              className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none transition-colors"
              placeholder="Название древа"
            />
            <input
              type="text"
              value={treeDescription}
              onChange={(e) => setTreeDescription(e.target.value)}
              disabled={isViewMode}
              className="text-sm text-text-light bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none transition-colors w-64"
              placeholder="Описание"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-lg transition-colors ${showInfo ? 'bg-primary text-white' : 'text-text-light hover:bg-gray-100'}`}
          >
            <Info size={20} />
          </button>
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg text-text-light hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Undo size={20} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg text-text-light hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Redo size={20} />
          </button>
          <button
            onClick={saveTreeData}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Save size={18} />
            <span>Сохранить</span>
          </button>
          <button
            onClick={() => setIsViewMode(!isViewMode)}
            className={`p-2 rounded-lg transition-colors ${isViewMode ? 'bg-primary text-white' : 'text-text-light hover:bg-gray-100'}`}
          >
            <Eye size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onNodeDrag={handleNodeDrag}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.Bezier}
          fitView
          className="bg-background"
          panOnDrag={!isViewMode}
          selectionOnDrag={!isViewMode}
          zoomOnScroll={!isViewMode}
          panOnScroll={!isViewMode}
        >
          <Background />
          <MiniMap />
          <Controls className="bg-white rounded-lg shadow-md" />
        </ReactFlow>

        {/* Connection Line */}
        {connectionSource && (
          <div className="absolute inset-0 pointer-events-none z-50">
            <svg className="w-full h-full">
              <line
                x1={nodes.find(n => n.id === connectionSource)?.position.x || 0}
                y1={nodes.find(n => n.id === connectionSource)?.position.y || 0}
                x2={connectionPosition.x}
                y2={connectionPosition.y}
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
        )}

        {/* Node Form Modal */}
        {showNodeForm && !isViewMode && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text">
                  {editingNode ? 'Редактировать узел' : 'Добавить узел'}
                </h3>
                <button
                  onClick={() => setShowNodeForm(false)}
                  className="text-text-light hover:text-text"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">ФИО</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-text-light" size={18} />
                    <input
                      type="text"
                      value={nodeFormData.name}
                      onChange={(e) => setNodeFormData({ ...nodeFormData, name: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Иванов Иван Иванович"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Фото (URL)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-3 text-text-light" size={18} />
                    <input
                      type="text"
                      value={nodeFormData.photoUrl}
                      onChange={(e) => setNodeFormData({ ...nodeFormData, photoUrl: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-light mb-1">Дата рождения</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-text-light" size={18} />
                      <input
                        type="date"
                        value={nodeFormData.birthDate}
                        onChange={(e) => setNodeFormData({ ...nodeFormData, birthDate: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-light mb-1">Пол</label>
                    <select
                      value={nodeFormData.gender}
                      onChange={(e) => setNodeFormData({ ...nodeFormData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    >
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Описание</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-text-light" size={18} />
                    <textarea
                      value={nodeFormData.description}
                      onChange={(e) => setNodeFormData({ ...nodeFormData, description: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all h-24 resize-none"
                      placeholder="Краткое описание..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNodeForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-text-light hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                  >
                    {editingNode ? 'Сохранить' : 'Добавить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Info Panel */}
        {showInfo && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-2xl p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Информация</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-text-light hover:text-text"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 text-sm text-text-light">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">
                  <Plus size={16} />
                </div>
                <div>
                  <p className="font-medium text-text">Добавить узел</p>
                  <p>Кликните по пустому месту на рабочей области или используйте кнопку "Добавить узел"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">
                  <LinkIcon size={16} />
                </div>
                <div>
                  <p className="font-medium text-text">Связать узлы</p>
                  <p>Начните перетаскивание от одного узла к другому для создания связи</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">
                  <Edit size={16} />
                </div>
                <div>
                  <p className="font-medium text-text">Редактировать узел</p>
                  <p>Кликните по узлу для редактирования его данных</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-red-500">
                  <Trash2 size={16} />
                </div>
                <div>
                  <p className="font-medium text-text">Удалить элемент</p>
                  <p>Кликните правой кнопкой по узлу или связи для удаления</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeEditor;
