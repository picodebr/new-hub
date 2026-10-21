import { getBlockly } from '@/_base/utils';
import Script from 'next/script';
import React, { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

const BlocklyContext = createContext<any>(null);

export const BlocklyProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [blockly, setBlockly] = useState<any>(null);

  useEffect(() => {
    setBlockly(getBlockly());
  }, []);

  return (
    <BlocklyContext.Provider value={blockly}>
      <Script strategy="beforeInteractive" src="/scratch/blockly_compressed_vertical.js" />
      <Script strategy="beforeInteractive" src="/scratch/blocks_vertical/vertical_extensions.js" />
      <Script strategy="beforeInteractive" src="/scratch/blocks_vertical/procedures.js" />
      <Script strategy="beforeInteractive" src="/scratch/msg/messages.js" />
      <Script strategy="beforeInteractive" src="/scratch/blocks_common/math.js" />
      <Script strategy="beforeInteractive" src="/scratch/blocks_common/matrix.js" />
      <Script strategy="beforeInteractive" src="/scratch/blocks_common/note.js" />
      <Script strategy="beforeInteractive" src="/scratch/blocks_common/text.js" />
      {children}
    </BlocklyContext.Provider>
  );
};

export const useBlockly = () => useContext(BlocklyContext);
