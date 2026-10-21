import axios from 'axios';
import { cookieManager } from '../../utils/tokenManager';

const API_ADDRESS =
  (import.meta.env.VITE_API_ADDRESS as string) ||
  (import.meta.env.NEXT_PUBLIC_API_ADDRESS as string) ||
  'https://ppkxh4imxx.us-east-1.awsapprunner.com';

export const api = axios.create({
  baseURL: `${API_ADDRESS}/user`,
});

api.interceptors.request.use((config) => {
  const token = cookieManager.getToken();
  if (token) {
    if (config.headers && typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      (config.headers as any) = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
});
