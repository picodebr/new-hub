export const isProduction = () => {
  const hash =
    typeof window !== 'undefined' ? window.location.hash.slice(1) : '';

  return hash !== 'local' && import.meta.env.VITE_NODE_ENV !== 'local';
};
