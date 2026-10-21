export const getBlockly = () =>
  typeof window !== 'undefined' ? (window as any).Blockly || null : null;
