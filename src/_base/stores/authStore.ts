import { create } from 'zustand';
import { IHubUser, EMPTY_HUB_USER, HubUserRole } from '@/_base/interfaces/user';
import { IHubUserSchool, IHubSchoolGroup } from '@/_base/interfaces/school';
import { hubLogin, googleLogin, validateSession } from '@/_base/services/auth';
import { updateChosenSchool, updateChosenSchoolGroup } from '@/_base/services/user';
import { listSchoolGroups } from '@/_base/services/school';
import { cookieManager } from '@/_base/utils';

export type UserRole = 'student' | 'teacher' | 'master';

export interface ExtendedHubUser extends Partial<IHubUser> {
  id: string;
  username: string;
  email: string;
  name: string;
  initial: string;
  role: HubUserRole;
  chosen_school_id?: string;
  hub_school_group_id?: string;
  schools?: IHubUserSchool[];
  [key: string]: any;
}

export interface AuthStoreState {
  user: ExtendedHubUser | null;
  isLoadingSession: boolean;
  isLoadingSchool: boolean;
  school: IHubUserSchool | null;
  schools: IHubUserSchool[];
  schoolGroups: IHubSchoolGroup[];
  selectedSchoolGroup: IHubSchoolGroup | null;
  customActions: any[];

  // Actions
  setUser: (user: ExtendedHubUser | null) => void;
  setSchool: (school: IHubUserSchool | null) => void;
  setSchools: (schools: IHubUserSchool[]) => void;
  setSchoolGroups: (groups: IHubSchoolGroup[]) => void;
  setSelectedSchoolGroup: (group: IHubSchoolGroup | null) => void;
  setCustomActions: (actions: any[]) => void;
  initSession: () => Promise<ExtendedHubUser | null>;
  changeSchool: (schoolId: string) => Promise<void>;
  changeSchoolGroup: (groupId: string) => Promise<void>;
  login: (identifier: string, password?: string, rememberMe?: boolean) => Promise<ExtendedHubUser | null>;
  loginWithGoogle: (accessToken: string) => Promise<ExtendedHubUser | null>;
  logout: () => void;
}

const STORAGE_KEY = 'picode.currentUser';

const formatUser = (user: any): ExtendedHubUser => {
  const name = user?.name || user?.display_name || user?.username || 'Usuário';
  const initial = name.trim().charAt(0).toUpperCase() || 'U';
  const rawRole = (user?.role || 'student').toLowerCase();
  const role: HubUserRole =
    rawRole === 'master' ? 'master' : rawRole === 'teacher' ? 'teacher' : 'student';

  const coins = Number(user?.metadata?.coins ?? 0);
  const streak =
    user?.metadata?.streak != null
      ? Number(user.metadata.streak)
      : user?.metadata?.first_access
      ? Math.max(0, Math.floor((Date.now() - new Date(user.metadata.first_access).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  return {
    ...EMPTY_HUB_USER,
    ...user,
    id: user?.id || '',
    name,
    initial,
    role,
    metadata: {
      ...user?.metadata,
      coins,
      streak,
    },
  };
};

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  isLoadingSession: true,
  isLoadingSchool: false,
  school: null,
  schools: [],
  schoolGroups: [],
  selectedSchoolGroup: null,
  customActions: [],

  setUser: (user) => {
    if (user) {
      const formatted = formatUser(user);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
      } catch {}
      set({ user: formatted });
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      set({ user: null, school: null, schools: [], selectedSchoolGroup: null });
    }
  },

  setSchool: (school) => set({ school }),
  setSchools: (schools) => set({ schools }),
  setSchoolGroups: (schoolGroups) => set({ schoolGroups }),
  setSelectedSchoolGroup: (selectedSchoolGroup) => set({ selectedSchoolGroup }),
  setCustomActions: (customActions) => set({ customActions }),

  initSession: async (): Promise<ExtendedHubUser | null> => {
    const token = cookieManager.getToken();
    if (!token) {
      set({ user: null, isLoadingSession: false, school: null });
      return null;
    }

    if (token === 'demo-token-123') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          set({
            user: parsed,
            school: parsed.schools?.[0] || null,
            schools: parsed.schools || [],
            isLoadingSession: false,
          });
          return parsed;
        }
      } catch {}
    }

    try {

      set({ isLoadingSession: true });
      const sessionData = await validateSession();
      if (!sessionData || !sessionData.id) {
        set({ user: null, isLoadingSession: false, school: null });
        return null;
      }

      const formatted = formatUser(sessionData);
      let targetSchool: IHubUserSchool | null = null;
      let targetSchools: IHubUserSchool[] = [];
      let targetGroups: IHubSchoolGroup[] = [];
      let targetChosenGroup: IHubSchoolGroup | null = null;

      if (formatted.role === 'master') {
        try {
          targetGroups = await listSchoolGroups();
          targetChosenGroup =
            targetGroups.find((g) => g.id === formatted.metadata?.chosen_school_group_id) ||
            targetGroups.find((g) => g.id === formatted.hub_school_group_id) ||
            targetGroups[0] ||
            null;

          if (targetChosenGroup && targetChosenGroup.schools) {
            targetSchools = targetChosenGroup.schools.map((s: any) => ({
              ...s,
              hub_school_id: s.id,
              hub_school_group_id: targetChosenGroup!.id,
              approved_at: new Date(),
              hub_school_group: targetChosenGroup!,
            }));

            targetSchool =
              targetSchools.find((s) => s.hub_school_id === formatted.chosen_school_id) ||
              targetSchools[0] ||
              null;
          }
        } catch (err) {
          console.warn('Erro ao carregar redes do master:', err);
        }
      } else if (formatted.role === 'teacher') {
        targetSchools = (formatted.schools || []).map((s: any) => ({
          ...s,
          hub_school_id: s.hub_school_id || s.id,
        }));
        targetSchool =
          targetSchools.find((s) => s.hub_school_id === formatted.chosen_school_id) ||
          targetSchools[0] ||
          null;
      } else {
        targetSchools = (formatted.schools || []).map((s: any) => ({
          ...s,
          hub_school_id: s.hub_school_id || s.id,
        }));
        targetSchool = targetSchools[0] || null;
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
      } catch {}

      set({
        user: formatted,
        school: targetSchool,
        schools: targetSchools,
        schoolGroups: targetGroups,
        selectedSchoolGroup: targetChosenGroup,
        isLoadingSession: false,
      });

      return formatted;
    } catch (err) {
      console.warn('Falha na validação de sessão:', err);
      cookieManager.forceTokenExpires();
      set({ user: null, isLoadingSession: false, school: null });
      return null;
    }
  },

  changeSchool: async (schoolId: string) => {
    try {
      set({ isLoadingSchool: true });
      await updateChosenSchool(schoolId);
      const updatedUser = await validateSession();
      const formatted = formatUser(updatedUser);

      const currentSchools = get().schools;
      const targetSchool =
        currentSchools.find((s) => s.hub_school_id === schoolId) ||
        formatted.schools?.find((s) => s.hub_school_id === schoolId) ||
        currentSchools[0] ||
        null;

      set({
        user: formatted,
        school: targetSchool,
        isLoadingSchool: false,
      });
    } catch (err) {
      console.error('Erro ao trocar escola:', err);
      set({ isLoadingSchool: false });
      throw err;
    }
  },

  changeSchoolGroup: async (groupId: string) => {
    try {
      set({ isLoadingSchool: true });
      await updateChosenSchoolGroup(groupId);

      const groups = get().schoolGroups.length > 0 ? get().schoolGroups : await listSchoolGroups();
      const chosenGroup = groups.find((g) => g.id === groupId) || groups[0] || null;

      let groupSchools: IHubUserSchool[] = [];
      if (chosenGroup && chosenGroup.schools) {
        groupSchools = chosenGroup.schools.map((s: any) => ({
          ...s,
          hub_school_id: s.id,
          hub_school_group_id: chosenGroup.id,
          approved_at: new Date(),
          hub_school_group: chosenGroup,
        }));
      }

      const firstSchool = groupSchools[0];
      if (firstSchool) {
        await updateChosenSchool(firstSchool.hub_school_id);
      }

      const updatedUser = await validateSession();
      const formatted = formatUser(updatedUser);

      set({
        user: formatted,
        schoolGroups: groups,
        selectedSchoolGroup: chosenGroup,
        schools: groupSchools,
        school: firstSchool || null,
        isLoadingSchool: false,
      });
    } catch (err) {
      console.error('Erro ao trocar rede escolar:', err);
      set({ isLoadingSchool: false });
      throw err;
    }
  },

  login: async (identifier: string, password?: string, rememberMe = true) => {
    if (identifier === 'prof@picode' || identifier === 'aluno@picode') {
      const isTeacher = identifier === 'prof@picode';
      const demoUser: ExtendedHubUser = {
        id: isTeacher ? 'demo-teacher-id' : 'demo-student-id',
        name: isTeacher ? 'Prof. Roberto Santos' : 'Ana Carolina',
        email: identifier,
        username: isTeacher ? 'prof_roberto' : 'ana_carolina',
        role: isTeacher ? 'teacher' : 'student',
        initial: isTeacher ? 'RS' : 'AC',
        display_name: isTeacher ? 'Prof. Roberto Santos' : 'Ana Carolina',
        school: {
          id: 'demo-school-id',
          name: 'Colégio Alpha Maker',
        },
        chosen_school_id: 'demo-school-id',
        schools: [
          {
            hub_school_id: 'demo-school-id',
            name: 'Colégio Alpha Maker',
            approved_at: new Date(),
          } as any,
        ],
        metadata: {
          coins: 240,
          streak: 12,
          accesses: 28,
        },
      };
      cookieManager.setToken('demo-token-123', 1);
      get().setUser(demoUser);
      set({
        user: demoUser,
        school: demoUser.schools?.[0] || null,
        schools: demoUser.schools || [],
        isLoadingSession: false,
      });
      return demoUser;
    }

    if (!password) throw new Error('Senha necessária');
    set({ isLoadingSession: true });

    try {
      const { access_token } = await hubLogin({
        identifier: identifier.trim(),
        password,
      });


      if (access_token) {
        cookieManager.setToken(access_token, rememberMe ? 15 : 1);
        const logged = await get().initSession();
        return logged;
      }
      return null;
    } finally {
      set({ isLoadingSession: false });
    }
  },

  loginWithGoogle: async (accessToken: string) => {
    set({ isLoadingSession: true });
    try {
      const { access_token } = await googleLogin(accessToken);
      if (access_token) {
        cookieManager.setToken(access_token, 15);
        const logged = await get().initSession();
        return logged;
      }
      return null;
    } finally {
      set({ isLoadingSession: false });
    }
  },

  logout: () => {
    cookieManager.forceTokenExpires();
    get().setUser(null);
  },
}));
