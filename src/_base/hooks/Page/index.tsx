import React, { PropsWithChildren, createContext, useContext } from 'react';

const PageContext = createContext({});
export const usePageContext = () => useContext(PageContext);

export const Page: React.FC<PropsWithChildren<any>> = ({ children }) => {
  return <PageContext.Provider value={{}}>{children}</PageContext.Provider>;
};
