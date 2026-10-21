/// <reference types="w3c-web-serial" />
export const supportSerialAPI = () =>
  typeof navigator !== 'undefined' && !!(navigator as any).serial;
