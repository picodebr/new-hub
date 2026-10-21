import { api } from '@/_base/classes/api';

export const removeProjectAnnotation = async (annotation_id: string): Promise<void> => {
  await api.delete(`/project/annotation/${annotation_id}`);
};
