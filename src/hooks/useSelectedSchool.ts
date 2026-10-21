import { useAuthStore } from '@/_base/stores/authStore';
import { IHubUserSchool, IHubSchoolGroup } from '@/_base/interfaces/school';

export interface UseSelectedSchoolReturn {
  school: IHubUserSchool | null;
  schools: IHubUserSchool[];
  setSchool: (school: IHubUserSchool | null) => void;
  setSchools: (schools: IHubUserSchool[]) => void;
  schoolGroups: IHubSchoolGroup[];
  setSchoolGroups: (groups: IHubSchoolGroup[]) => void;
  selectedSchoolGroup: IHubSchoolGroup | null;
  setSelectedSchoolGroup: (group: IHubSchoolGroup | null) => void;
  changeSchool: (schoolId: string) => Promise<void>;
  changeSchoolGroup: (groupId: string) => Promise<void>;
  isLoadingSchool: boolean;
  customActions: any[];
  setCustomActions: (actions: any[]) => void;
}

export const useSelectedSchool = (): UseSelectedSchoolReturn => {
  const school = useAuthStore((s) => s.school);
  const schools = useAuthStore((s) => s.schools);
  const setSchool = useAuthStore((s) => s.setSchool);
  const setSchools = useAuthStore((s) => s.setSchools);
  const schoolGroups = useAuthStore((s) => s.schoolGroups);
  const setSchoolGroups = useAuthStore((s) => s.setSchoolGroups);
  const selectedSchoolGroup = useAuthStore((s) => s.selectedSchoolGroup);
  const setSelectedSchoolGroup = useAuthStore((s) => s.setSelectedSchoolGroup);
  const changeSchool = useAuthStore((s) => s.changeSchool);
  const changeSchoolGroup = useAuthStore((s) => s.changeSchoolGroup);
  const isLoadingSchool = useAuthStore((s) => s.isLoadingSchool);
  const customActions = useAuthStore((s) => s.customActions);
  const setCustomActions = useAuthStore((s) => s.setCustomActions);

  return {
    school,
    schools,
    setSchool,
    setSchools,
    schoolGroups,
    setSchoolGroups,
    selectedSchoolGroup,
    setSelectedSchoolGroup,
    changeSchool,
    changeSchoolGroup,
    isLoadingSchool,
    customActions,
    setCustomActions,
  };
};

export default useSelectedSchool;
