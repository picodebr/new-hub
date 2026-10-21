import { api } from '@/_base/classes/api';

export const finishHubFormClass = async (hub_form_class_id: string): Promise<void> => {
  await api.put(`/form/finish/${hub_form_class_id}`);
};
