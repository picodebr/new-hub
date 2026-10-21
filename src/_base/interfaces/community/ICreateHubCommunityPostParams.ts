import { z } from 'zod';
import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { IHubCommunityPostMetadata } from './IHubCommunityPostMetadata';

export interface ICreateHubCommunityPostParams {
  content: string;
  hub_community_post_id?: string;
  metadata?: Partial<IHubCommunityPostMetadata>;
}

export const EMPTY_CREATE_POST_DATA: ICreateHubCommunityPostParams = {
  content: '',
  metadata: { media: [] },
};

/** Zod schemas */
export const communityPostSchema: ZodCustomSchema<ICreateHubCommunityPostParams> = z.object({
  content: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).min(1, { message: zodSchemaErrors.REQUIRED_FIELD }),
  hub_community_post_id: z.string().uuid().optional(),
  metadata: z.any(),
});
