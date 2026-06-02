import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { DEFAULT_AVATAR, type AvatarConfig } from '@/components/dashboard/student/AvatarCustomizer';

interface StudentAvatarContextValue {
  avatar: AvatarConfig;
  setAvatar: (cfg: AvatarConfig) => void;
}

const StudentAvatarContext = createContext<StudentAvatarContextValue | undefined>(undefined);

const STORAGE_KEY = 'picode.studentAvatar';

export const StudentAvatarProvider = ({ children }: { children: ReactNode }) => {
  const [avatar, setAvatarState] = useState<AvatarConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AvatarConfig) : DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(avatar));
    } catch {
      /* ignore */
    }
  }, [avatar]);

  const value = useMemo<StudentAvatarContextValue>(
    () => ({ avatar, setAvatar: setAvatarState }),
    [avatar]
  );

  return <StudentAvatarContext.Provider value={value}>{children}</StudentAvatarContext.Provider>;
};

export const useStudentAvatar = () => {
  const ctx = useContext(StudentAvatarContext);
  if (!ctx) throw new Error('useStudentAvatar must be used within StudentAvatarProvider');
  return ctx;
};
