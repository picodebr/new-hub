import { z } from 'zod';
import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { IHubReportMetadata } from './IHubReportMetadata';

export interface ICreateHubReportParams {
  context: string;
  subject: string;
  text: string;
  files: string[];
  metadata: IHubReportMetadata;
}

export const EMPTY_CREATE_REPORT_DATA: ICreateHubReportParams = {
  context: '',
  subject: '',
  text: '',
  files: [],
  metadata: { school_name: `` },
};

/** Zod schemas */
export const reportSchema: ZodCustomSchema<ICreateHubReportParams> = z.object({
  context: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).min(1, { message: zodSchemaErrors.REQUIRED_FIELD }),
  subject: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).min(1, { message: zodSchemaErrors.REQUIRED_FIELD }),
  text: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).min(20, { message: `A descrição deve ter no minimo 20 caracteres` }),
  files: z.any(),
  metadata: z.any(),
});
