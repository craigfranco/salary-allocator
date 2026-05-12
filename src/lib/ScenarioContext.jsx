import React, { createContext, useContext, useState } from 'react';

const ScenarioContext = createContext({ 
  activeScenario: null, 
  setActiveScenario: () => {},
  scenarioData: null,
  setScenarioData: () => {}
});

export function ScenarioProvider({ children }) {
  const [activeScenario, setActiveScenario] = useState(null); // { id, name }
  const [scenarioData, setScenarioData] = useState(null); // Full employee snapshot when scenario is active
  
  return (
    <ScenarioContext.Provider value={{ activeScenario, setActiveScenario, scenarioData, setScenarioData }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  return useContext(ScenarioContext);
}