import React, { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '@/constants/api';

export interface HistoryEntry {
  id: string;
  name?: string | null;
  fromText: string;
  toText: string;
  fromLang: string;
  toLang: string;
  is_favorite: boolean;
}

interface HistoryContextType {
  history: HistoryEntry[];
  isLoading: boolean;
  fetchHistory: () => Promise<void>;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'is_favorite'>) => Promise<void>;
  updateHistoryName: (id: string, name: string) => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addHistoryEntry = async (entry: Omit<HistoryEntry, 'id' | 'userId' | 'is_favorite'>) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error('Failed to add history entry');
      const newEntry = await response.json();
      setHistory((prev) => [newEntry, ...prev]);
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  };

  const updateHistoryName = async (id: string, name: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/history/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to update history name');
      // Actualiza el estado local
      setHistory(prev => prev.map(item => item.id === id ? { ...item, name } : item));
    } catch (error) {
      console.error(`Error updating history name for id ${id}:`, error);
    }
  };

  const toggleFavorite = async (id: string) => {
    if (!token) return;

    // Actualiza el estado local inmediatamente para una UI receptiva
    setHistory(prev => 
      prev.map(item => 
        item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
      )
    );

    try {
      const response = await fetch(`${API_URL}/api/history/${id}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to toggle favorite status');
      }
      // Opcional: podrías volver a cargar el historial para asegurar la consistencia,
      // pero la actualización optimista suele ser suficiente.
      // await fetchHistory();
    } catch (error) {
      console.error(`Error toggling favorite for id ${id}:`, error);
      // Si falla, revierte el cambio en el estado local
      setHistory(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
        )
      );
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        let errorDetails = 'Failed to delete entry';
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await response.json();
            errorDetails = errorData.error || errorDetails;
        }
        throw new Error(errorDetails);
      }

      setHistory((prev) => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(`Error deleting history entry with id ${id}:`, error);
      throw error; // Lanza el error para que la UI lo atrape
    }
  };

  return (
    <HistoryContext.Provider value={{ 
      history, 
      isLoading,
      fetchHistory,
      addHistoryEntry,
      updateHistoryName,
      deleteHistoryEntry,
      toggleFavorite
    }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}; 