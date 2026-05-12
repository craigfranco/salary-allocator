import React, { createContext, useContext, useState } from 'react';

const ScenarioContext = createContext({ 
  activeScenario: null, 
  setActiveScenario: () => {},
  scenarioData: null,
  setScenarioData: () => {},
  suppressSalaries: false,
  setSuppressSalaries: () => {}
});

export function ScenarioProvider({ children }) {
  const [activeScenario, setActiveScenario] = useState(null); // { id, name }
  const [scenarioData, setScenarioData] = useState(null); // Full employee snapshot when scenario is active
  const [suppressSalaries, setSuppressSalaries] = useState(false);
  
  return (
    <ScenarioContext.Provider value={{ activeScenario, setActiveScenario, scenarioData, setScenarioData, suppressSalaries, setSuppressSalaries }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  return useContext(ScenarioContext);
}