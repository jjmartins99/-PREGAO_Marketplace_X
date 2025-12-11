
import React, { createContext, useState, ReactNode, useMemo } from 'react';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children?: ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const value = useMemo(() => ({
    searchTerm,
    setSearchTerm,
  }), [searchTerm]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};
