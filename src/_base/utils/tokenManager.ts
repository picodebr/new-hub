/* eslint-disable no-console */
import Cookies from 'js-cookie';

const COOKIE_TOKEN_LABEL = 'access_token';

export type NextAppRequest = { cookies: Partial<{ [key: string]: string }> };
export type ServerResponseLike = { setHeader?: (name: string, value: string) => void };

export interface ITokenManager {
  setToken: (token: string, expires?: number) => void;
  getToken: (parse?: boolean) => string | null;
  forceTokenExpires: (res?: ServerResponseLike) => void;
  updateToken: (req?: NextAppRequest) => void;
  getCookie: <T = string>(name: string, parse?: boolean, decode?: boolean) => T | null;
  setCookie: (name: string, value: string, expires?: number, encode?: boolean) => void;
}

export const cookieManager: ITokenManager = {
  setToken: (token, expires = 1) => {
    Cookies.set(btoa(COOKIE_TOKEN_LABEL), btoa(token), { expires });
    try {
      localStorage.setItem('access_token', token);
      localStorage.setItem(btoa(COOKIE_TOKEN_LABEL), btoa(token));
    } catch {}
  },
  getToken: () => {
    const encodedToken = Cookies.get(btoa(COOKIE_TOKEN_LABEL));
    if (encodedToken) {
      try {
        return atob(encodedToken);
      } catch {
        return encodedToken;
      }
    }
    try {
      const localToken = localStorage.getItem('access_token');
      if (localToken) return localToken;
      const encodedLocal = localStorage.getItem(btoa(COOKIE_TOKEN_LABEL));
      if (encodedLocal) return atob(encodedLocal);
    } catch {}
    return null;
  },
  forceTokenExpires: (res) => {
    Cookies.remove(btoa(COOKIE_TOKEN_LABEL));
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem(btoa(COOKIE_TOKEN_LABEL));
    } catch {}
    if (res?.setHeader) {
      res.setHeader('Set-Cookie', `${btoa(COOKIE_TOKEN_LABEL)}=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    }
  },
  updateToken: (req) => {
    const access_token = req?.cookies?.[btoa(COOKIE_TOKEN_LABEL)];
    if (access_token) {
      try {
        const decoded = atob(access_token);
        cookieManager.setToken(decoded);
      } catch {}
    }
  },
  getCookie: (name, parse, decode = true) => {
    const encodedToken = Cookies.get(decode ? btoa(name) : name);

    try {
      if (encodedToken)
        return parse
          ? JSON.parse(decode ? atob(encodeURIComponent(encodedToken)) : encodedToken)
          : decode
          ? atob(encodeURIComponent(encodedToken))
          : encodedToken;
    } catch {
      try {
        if (encodedToken) return parse ? JSON.parse(decode ? atob(encodedToken) : encodedToken) : decode ? atob(encodedToken) : encodedToken;
        return null;
      } catch (err) {
        console.error(`Error on get cookies`, err);
      }
      return null;
    }
  },
  setCookie: (name, value, expires = 1, encode = true) => {
    try {
      Cookies.set(encode ? btoa(decodeURIComponent(name)) : name, encode ? btoa(decodeURIComponent(value)) : value, { expires });
    } catch {
      try {
        Cookies.set(encode ? btoa(name) : name, encode ? btoa(value) : value, { expires });
      } catch (err) {
        console.error(`Error on set cookies`, err);
      }
    }
  },
};
