import { api } from '@/_base/classes/api';
import { IHubCertificate } from '@/_base/interfaces/certificate';

export const listUserCertificates = async (): Promise<IHubCertificate[]> => {
  const { data } = await api.get(`/certificates`);
  return data;
};
