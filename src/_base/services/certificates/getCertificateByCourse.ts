import { api } from '@/_base/classes/api';
import { ICertificateTemplate } from '@/_base/interfaces/certificate/ICertificateTemplate';

interface IResponse {
  templates: ICertificateTemplate[];
}
export const getCertificateByCourse = async (course_id: string): Promise<IResponse> => {
  const { data } = await api.get(`/course/certificate_template/${course_id}`);
  return data;
};
