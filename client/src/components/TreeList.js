import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, TreePine } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const TreeList = () => {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchTrees = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/trees');
      const data = await response.json();
      setTrees(data);
    } catch (error) {
      console.error('Error fetching trees:', error);
      showToast('Ошибка загрузки древ', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const handleCreateTree = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Новое древо',
          description: 'Описание семьи'
        })
      });
      const newTree = await response.json();
      setTrees(prev => [newTree, ...prev]);
      showToast('Генеалогическое древо создано', 'success');
      navigate(`/tree/${newTree.id}/edit`);
    } catch (error) {
      console.error('Error creating tree:', error);
      showToast('Ошибка создания древа', 'error');
    }
  };

  const handleEditTree = (treeId) => {
    navigate(`/tree/${treeId}/edit`);
  };

  const handleDeleteTree = async (treeId, e) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить это древо?')) {
      try {
        await fetch(`http://localhost:5000/api/trees/${treeId}`, {
          method: 'DELETE'
        });
        setTrees(prev => prev.filter(tree => tree.id !== treeId));
        showToast('Генеалогическое древо удалено', 'success');
      } catch (error) {
        console.error('Error deleting tree:', error);
        showToast('Ошибка удаления древа', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text">Генеалогические древа</h1>
          <p className="text-text-light mt-2">Управление семейными древами</p>
        </div>
        <button
          onClick={handleCreateTree}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          <span>Создать новое древо</span>
        </button>
      </div>

      {trees.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
            <TreePine size={48} className="text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">Нет созданных древ</h3>
          <p className="text-text-light mb-6">Начните с создания первого генеалогического древа</p>
          <button
            onClick={handleCreateTree}
            className="flex items-center gap-2 mx-auto bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Создать древо</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trees.map(tree => (
            <div
              key={tree.id}
              onClick={() => handleEditTree(tree.id)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <TreePine size={64} className="text-primary/20 group-hover:text-primary/40 transition-colors" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-text mb-2 group-hover:text-primary transition-colors">
                  {tree.name}
                </h3>
                {tree.description && (
                  <p className="text-text-light text-sm mb-4 line-clamp-2">
                    {tree.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-text-light">
                  <span>Создано: {new Date(tree.created_at).toLocaleDateString('ru-RU')}</span>
                  <span>{tree.id}</span>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={(e) => handleDeleteTree(tree.id, e)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить древо"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeList;
