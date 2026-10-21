import { api } from '@/_base/classes/api';
import { IHubFormClassAnswers } from '@/_base/interfaces/form';

export const updateHubFormClassUser = async (hub_form_class_user_id: string, questions: IHubFormClassAnswers[]): Promise<void> => {
  await api.patch(`/form/update/${hub_form_class_user_id}`, { questions });
};
