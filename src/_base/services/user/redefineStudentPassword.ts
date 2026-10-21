import { api } from '@/_base/classes/api';

export const redefineStudentPassword = async (student_id: string, new_password: string): Promise<void> => {
  await api.put(`/redefine_student_password/${student_id}`, { new_password });
};
