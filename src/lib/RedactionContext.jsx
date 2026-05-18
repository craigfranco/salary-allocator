import React, { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'salary_redacted_ids';

function loadFromStorage() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

const RedactionContext = createContext(null);

export function RedactionProvider({ children }) {
  const [redactedIds, setRedactedIds] = useState(loadFromStorage);

  const toggle = (id) => {
    setRedactedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const clearAll = () => {
    setRedactedIds(new Set());
    localStorage.setItem(STORAGE_KEY, '[]');
  };

  return (
    <RedactionContext.Provider value={{ redactedIds, toggle, clearAll }}>
      {children}
    </RedactionContext.Provider>
  );
}

export function useRedactedIds() {
  return useContext(RedactionContext);
}