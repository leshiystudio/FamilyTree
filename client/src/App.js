import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TreeList from './components/TreeList';
import TreeEditor from './components/TreeEditor';
import TreeView from './components/TreeView';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<TreeList />} />
        <Route path="/tree/:id/edit" element={<TreeEditor />} />
        <Route path="/tree/:id" element={<TreeView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
