import { useAuthStore } from '@/_base/stores/authStore';
import { IHubUser } from '@/_base/interfaces/user';

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isLoadingSession = useAuthStore((s) => s.isLoadingSession);
  const initSession = useAuthStore((s) => s.initSession);

  return {
    user: user as unknown as IHubUser,
    setUser: (u: IHubUser) => setUser(u as any),
    isLoadingSession,
    refreshSession: initSession,
  };
};

export default useAuth;
