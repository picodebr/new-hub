import { api } from '@/_base/classes/api';
import { IHubNotification } from '@/_base/interfaces/notification';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IStoreMakerSchool } from '@/_base/interfaces/storeMaker';

interface IResponse {
  notifications: IPagingResponse<IHubNotification>;
  stocks: IStoreMakerSchool[];
}

export const getNotifications = async (schoolId: string): Promise<IResponse> => {
  const { data } = await api.get(`/notification/list/${schoolId}`);
  return data;
};
