import router, { NextRouter, useRouter } from 'next/router';

import React, { PropsWithChildren, useContext, useMemo } from 'react';
import { useLoading } from '../Loading';
import { HookLoadingType } from '../Loading/interfaces';

const CustomRouterContext = React.createContext(router as NextRouter & { push: (url: string, loadingType?: HookLoadingType) => void });

export const CustomRouterProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const nextRouter = useRouter();
  const { setLoadingConfig } = useLoading();

  useMemo(() => {
    const previousPush = nextRouter.push;

    nextRouter.push = async (url, loadingType?: HookLoadingType) => {
      setLoadingConfig((cfg) => ({ ...cfg, isLoading: true, type: loadingType || `darken-spinner` }));
      return await previousPush.bind(nextRouter)(url);
    };
  }, [nextRouter, setLoadingConfig]);

  return <CustomRouterContext.Provider value={nextRouter}>{children}</CustomRouterContext.Provider>;
};

export const useCustomRouter = () => useContext(CustomRouterContext);
