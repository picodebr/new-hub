import { api } from '@/_base/classes/api';
import { AccessControlList, BucketFolders, IPreSignedUploadResponse } from '@/_base/interfaces/upload';

export const getPresignedUrl = async (mimetype: string, folder?: BucketFolders, ACL?: AccessControlList): Promise<IPreSignedUploadResponse> => {
  const { data } = await api.get(`/upload/presigned?mimetype=${mimetype}&folder=${folder || ''}&ACL=${ACL || ''}`);
  return data;
};
