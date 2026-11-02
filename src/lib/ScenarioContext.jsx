import React, { createContext, useContext, useState } from 'react';

const ScenarioContext = createContext(null);

export function ScenarioProvider({ children }) {
  // Per-department scenario state: { COMMERCIAL: { activeScenario, scenarioData }, FINANCE: {...}, ... }
  const [stateByDept, setStateByDept] = useState({});

  const setDeptState = (dept, patch) =>
    setStateByDept(prev => ({
      ...prev,
      [dept]: { activeScenario: null, scenarioData: null, ...(prev[dept] || {}), ...patch },
    }));

  // Selecting a scenario just displays its saved snapshot as-is (no edit application).
  const restoreFor = (dept) => (scenario) => {
    const snapshotCopy = Array.isArray(scenario.snapshot) ? JSON.parse(JSON.stringify(scenario.snapshot)) : [];
    setDeptState(dept, { activeScenario: { id: scenario.id, name: scenario.name }, scenarioData: snapshotCopy });
  };

  const clearFor = (dept) => () => setDeptState(dept, { activeScenario: null, scenarioData: null });

  return (
    <ScenarioContext.Provider value={{ stateByDept, setDeptState, restoreFor, clearFor }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario(department = 'COMMERCIAL') {
  const { stateByDept, setDeptState, restoreFor, clearFor } = useContext(ScenarioContext);
  const s = stateByDept[department] || {};
  return {
    activeScenario: s.activeScenario || null,
    setActiveScenario: (sc) => setDeptState(department, { activeScenario: sc }),
    scenarioData: s.scenarioData !== undefined ? s.scenarioData : null,
    setScenarioData: (data) => setDeptState(department, { scenarioData: data }),
    restoreScenario: restoreFor(department),
    clearScenario: clearFor(department),
  };
}