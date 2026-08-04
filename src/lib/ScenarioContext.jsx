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
  // Transient working copy of the currently-displayed scenario's saved snapshot.
  const [scenarioData, setScenarioData] = useState(null);

  // Selecting a scenario just displays its saved snapshot as-is (no edit application).
  const restoreScenario = (scenario) => {
    const snapshotCopy = Array.isArray(scenario.snapshot) ? JSON.parse(JSON.stringify(scenario.snapshot)) : [];
    setActiveScenario({ id: scenario.id, name: scenario.name });
    setScenarioData(snapshotCopy);
  };

  const clearScenario = () => {
    setActiveScenario(null);
    setScenarioData(null);
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