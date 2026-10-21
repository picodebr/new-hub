import { useAuthStore } from '@/_base/stores/authStore';
import { IHubUser } from '@/_base/interfaces/user';

export const useProfile = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return {
    user: user as unknown as IHubUser,
    setUser: (u: IHubUser) => setUser(u as any),
  };
};

export const useAvatar = () => {
  const user = useAuthStore((s) => s.user);
  return {
    avatar: user?.avatar || '',
  };
};
