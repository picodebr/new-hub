export const getOriginFromUrl = (url: string) => {
  if (!url) return '';
  const { protocol, host } = new URL(url);
  return `${protocol}//${host}`;
};
