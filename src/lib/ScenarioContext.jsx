import React, { createContext, useContext, useState } from 'react';

const ScenarioContext = createContext({
  activeScenario: null,
  setActiveScenario: () => {},
  scenarioData: null,
  setScenarioData: () => {},
  restoreScenario: () => {},
  clearScenario: () => {},
});

export function ScenarioProvider({ children }) {
  const [activeScenario, setActiveScenario] = useState(null); // { id, name }
  // Per-scenario working copies so edits persist when switching between scenarios.
  const [cache, setCache] = useState({}); // { [scenarioId]: employee[] }

  const scenarioData = activeScenario ? cache[activeScenario.id] ?? null : null;

  const setScenarioData = (data) => {
    if (!activeScenario?.id) return;
    setCache(prev => ({ ...prev, [activeScenario.id]: data }));
  };

  // Switch to a scenario, preserving any previously-edited working copy for it.
  // Only seed from the saved snapshot the first time the scenario is loaded.
  const restoreScenario = (scenario) => {
    setActiveScenario({ id: scenario.id, name: scenario.name });
    setCache(prev => {
      if (prev[scenario.id] != null) return prev;
      const snapshotCopy = Array.isArray(scenario.snapshot) ? JSON.parse(JSON.stringify(scenario.snapshot)) : [];
      return { ...prev, [scenario.id]: snapshotCopy };
    });
  };

  const clearScenario = () => {
    setActiveScenario(null);
  };

  return (
    <ScenarioContext.Provider value={{ activeScenario, setActiveScenario, scenarioData, setScenarioData, restoreScenario, clearScenario }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  return useContext(ScenarioContext);
}