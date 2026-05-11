import React, { createContext, useContext, useState } from 'react';

const ScenarioContext = createContext({ activeScenario: null, setActiveScenario: () => {} });

export function ScenarioProvider({ children }) {
  const [activeScenario, setActiveScenario] = useState(null); // { id, name }
  return (
    <ScenarioContext.Provider value={{ activeScenario, setActiveScenario }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  return useContext(ScenarioContext);
}