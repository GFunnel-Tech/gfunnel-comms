import { createContext, useContext } from 'react';

interface ActiveTabContextType {
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const ActiveTabContext = createContext<ActiveTabContextType>({
  activeTab: 'messages',
  setActiveTab: () => {},
});

export function useActiveTabContext() {
  return useContext(ActiveTabContext);
}
