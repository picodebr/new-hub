import { api } from '@/_base/classes/api';
import { IHubCertificate } from '@/_base/interfaces/certificate';

export const registerCertificate = async (course_id: string, custom_certificate: string): Promise<IHubCertificate> => {
  const { data } = await api.post(`/course/certificate`, { course_id, custom_certificate });
  return data;
};
