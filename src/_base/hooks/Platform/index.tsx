import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

interface IContext {
  isMobileApp: boolean;
}

const Context = createContext<IContext>({ isMobileApp: false });

export const PlatformProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isMobileApp, setIsMobileApp] = useState(false);

  const info = useMemo(() => ({ isMobileApp }), [isMobileApp]);

  useEffect(() => {
    const handleMessage = ({ data }: MessageEventInit) => {
      data === 'mobile-app' && setIsMobileApp(true);
    };

    document.addEventListener('message', handleMessage);
    return () => document.removeEventListener('message', handleMessage);
  }, []);

  return <Context.Provider value={info}>{children}</Context.Provider>;
};

export const usePlatform = () => useContext(Context);
