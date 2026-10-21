import { useEffect, useMemo, ReactNode, useCallback } from 'react';
import { IHubUser } from '@/_base/interfaces/user';
import { IHubUserSchool, IHubSchoolGroup } from '@/_base/interfaces/school';
import { useAuthStore, ExtendedHubUser } from '@/_base/stores/authStore';
import { RedefinePasswordDialog } from '@/components/auth/RedefinePasswordDialog';
import { useState } from 'react';

export type UserRole = 'student' | 'teacher' | 'master';
export type { ExtendedHubUser };

export interface UserContextValue {
  user: ExtendedHubUser | null;
  login: (identifier: string, password?: string, rememberMe?: boolean) => Promise<ExtendedHubUser | null>;
  loginWithGoogle: (accessToken: string) => Promise<ExtendedHubUser | null>;
  logout: () => void;
  setUser: (user: ExtendedHubUser | null) => void;
  refreshUser: () => Promise<ExtendedHubUser | null>;
  chosenSchool: IHubUserSchool | null;
  setChosenSchool: (schoolId: string) => Promise<void>;
  chosenSchoolGroup: IHubSchoolGroup | null;
  setChosenSchoolGroup: (groupId: string) => Promise<void>;
  schools: IHubUserSchool[];
  schoolGroups: IHubSchoolGroup[];
  isLoading: boolean;
  isLoadingSession: boolean;
  isMaster: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const isLoadingSession = useAuthStore((s) => s.isLoadingSession);
  const school = useAuthStore((s) => s.school);
  const schools = useAuthStore((s) => s.schools);
  const schoolGroups = useAuthStore((s) => s.schoolGroups);
  const selectedSchoolGroup = useAuthStore((s) => s.selectedSchoolGroup);
  const initSession = useAuthStore((s) => s.initSession);
  const changeSchool = useAuthStore((s) => s.changeSchool);
  const changeSchoolGroup = useAuthStore((s) => s.changeSchoolGroup);
  const setUser = useAuthStore((s) => s.setUser);

  const [showRedefineDialog, setShowRedefineDialog] = useState(false);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    if (user?.metadata?.redefine_password) {
      setShowRedefineDialog(true);
    }
  }, [user]);

  return (
    <>
      {children}
      {user && (
        <RedefinePasswordDialog
          open={showRedefineDialog}
          userName={user.name}
          onSuccess={() => {
            setShowRedefineDialog(false);
            if (user.metadata) {
              user.metadata.redefine_password = false;
              setUser({ ...user });
            }
          }}
        />
      )}
    </>
  );
};

export const useUser = (): UserContextValue => {
  const user = useAuthStore((s) => s.user);
  const isLoadingSession = useAuthStore((s) => s.isLoadingSession);
  const isLoadingSchool = useAuthStore((s) => s.isLoadingSchool);
  const school = useAuthStore((s) => s.school);
  const schools = useAuthStore((s) => s.schools);
  const schoolGroups = useAuthStore((s) => s.schoolGroups);
  const selectedSchoolGroup = useAuthStore((s) => s.selectedSchoolGroup);
  const setUser = useAuthStore((s) => s.setUser);
  const initSession = useAuthStore((s) => s.initSession);
  const changeSchool = useAuthStore((s) => s.changeSchool);
  const changeSchoolGroup = useAuthStore((s) => s.changeSchoolGroup);
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const logout = useAuthStore((s) => s.logout);

  const role = user?.role || 'student';
  const isMaster = role === 'master';
  const isTeacher = role === 'teacher' || role === 'master';
  const isStudent = role === 'student';

  return {
    user,
    login,
    loginWithGoogle,
    logout,
    setUser,
    refreshUser: initSession,
    chosenSchool: school,
    setChosenSchool: changeSchool,
    chosenSchoolGroup: selectedSchoolGroup,
    setChosenSchoolGroup: changeSchoolGroup,
    schools,
    schoolGroups,
    isLoading: isLoadingSession || isLoadingSchool,
    isLoadingSession,
    isMaster,
    isTeacher,
    isStudent,
  };
};

export { useSelectedSchool } from '@/hooks/useSelectedSchool';
export default useUser;
