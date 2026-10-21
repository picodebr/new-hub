import { api } from '@/_base/classes/api';

export const downloadClassForms = async (class_ids: string[]): Promise<Blob | null> => {
  if (!class_ids || !class_ids.length) return null;
  const { data } = await api.post(
    '/class/export-pdf',
    { class_ids },
    {
      responseType: 'blob',
    },
  );

  return data;
};
