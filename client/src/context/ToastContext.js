import React, { createContext, useContext, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster, toast } from 'react-hot-toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const showToast = useCallback((message, type = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast.info(message);
        break;
      default:
        toast(message);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster position="top-right" />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
