import React, { PropsWithChildren, useContext, useEffect, useState, createContext } from 'react';
import { useDarkMode } from '../useDarkMode';
import { ILoadingConfig, ILoadingContext, ILoadingProviderProps } from './interfaces';
import { useAuth } from '../Auth';
import { formatShortName } from '@/_base/utils';

const defaultConfig: ILoadingConfig = { isLoading: false, type: 'spinner' };

const LoadingContext = createContext<ILoadingContext>({
  loadingConfig: { ...defaultConfig },
  setLoadingConfig: () => ({}),
  runTransition: () => ({}),
});

export const LoadingProvider: React.FC<PropsWithChildren<ILoadingProviderProps>> = ({ children, changeSignal }) => {
  const [loadingConfig, setLoadingConfig] = useState({ ...defaultConfig });
  const [randomMsg, setRandomMsg] = useState('');
  const { colorMode } = useDarkMode();
  const { user } = useAuth();

  useEffect(() => {
    setLoadingConfig(() => ({ ...defaultConfig }));
    setRandomMsg(getRandomMessage());
  }, [changeSignal]);

  const runTransition = (time = 500) => {
    setLoadingConfig({ isLoading: true });
    setTimeout(() => setLoadingConfig({ isLoading: false }), time);
  };

  const getRandomMessage = () => {
    return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  };

  return (
    <LoadingContext.Provider value={{ loadingConfig, setLoadingConfig, runTransition }}>
      {loadingConfig.isLoading && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
            loadingConfig.type === 'darken-spinner' ? 'bg-black/50 backdrop-blur-sm' : 'bg-background/80 backdrop-blur-md'
          }`}
        >
          {loadingConfig.type === 'fullscreen' && (
            <div className="flex flex-col items-center justify-center">
              <img src="/loading/rocket-loading.gif" alt="Carregando..." className="w-24 h-24 object-contain" />
            </div>
          )}

          {(loadingConfig.type === 'spinner' || loadingConfig.type === 'darken-spinner') && (
            <div className="flex flex-col items-center justify-center">
              <img src="/loading/rocket-picode.gif" alt="Carregando..." className="h-64 object-contain" />
            </div>
          )}

          {loadingConfig.type === 'fullscreen-with-info' && (
            <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-border flex flex-col items-center text-center space-y-4 shadow-2xl">
              <img src="/loading/rocket-loading.gif" alt="Foguete" className="w-20 h-20 object-contain" />
              {user?.name && (
                <div className="text-lg font-bold text-foreground">
                  Bem-vindo(a), <span className="text-primary">{formatShortName(user.name, true)}</span>!
                </div>
              )}
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "{randomMsg}"
              </p>
            </div>
          )}
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);

const LOADING_MESSAGES = [
  'Com determinação e esforço, cada desafio se transforma em uma oportunidade de aprendizado.',
  'É melhor você tentar algo, vê-lo não funcionar e aprender com isso, do que não fazer nada.',
  'Nossa maior fraqueza é desistir. O caminho mais certo para o sucesso é sempre tentar apenas uma vez mais.',
  'O tempo de estudo nunca é um tempo perdido.',
  'Estudar é investir no seu futuro.',
  'O sucesso não cai do céu. Ele exige muita luta, esforço, estudo e força de vontade.',
  'O fracasso é uma ótima oportunidade para começar de novo de forma mais inteligente.',
  'A melhor forma de prever o futuro é criá-lo.',
  'Sucesso é o acúmulo de pequenos esforços, repetidos dia e noite.',
  'Uma pessoa que nunca cometeu um erro nunca tentou nada novo.',
  'Comece de onde você está. Use o que você tiver. Faça o que você puder.',
  'Para grandes resultados não existem atalhos.',
  'Educação é a arma mais poderosa que você pode usar para mudar o mundo.',
  'Busque sempre o progresso, não a perfeição.',
];
