import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type UserRole = 'student' | 'teacher';

export interface MockUser {
  username: string;
  email: string;
  name: string;
  initial: string;
  role: UserRole;
}

export const MOCK_USERS: MockUser[] = [
  {
    username: 'prof@picode',
    email: 'professor@picode.com.br',
    name: 'João Ênfáse',
    initial: 'J',
    role: 'teacher',
  },
  {
    username: 'aluno@picode',
    email: 'aluno@picode.com.br',
    name: 'Ana Maker',
    initial: 'A',
    role: 'student',
  },
];

interface UserContextValue {
  user: MockUser | null;
  login: (identifier: string) => MockUser | null;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const STORAGE_KEY = 'picode.currentUser';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MockUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      login: (identifier: string) => {
        const id = identifier.trim().toLowerCase();
        const found =
          MOCK_USERS.find((u) => u.username.toLowerCase() === id) ||
          MOCK_USERS.find((u) => u.email.toLowerCase() === id) ||
          // fallback: any input containing "aluno" → student, else teacher
          (id.includes('aluno') ? MOCK_USERS.find((u) => u.role === 'student')! : MOCK_USERS.find((u) => u.role === 'teacher')!);
        setUser(found ?? null);
        return found ?? null;
      },
      logout: () => setUser(null),
    }),
    [user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
