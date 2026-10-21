import { IProjectFolder, IProjectFolderListingItem } from '@/_base/interfaces/codeFolder/IProjectFolder';
import { HtmlHTMLAttributes } from 'react';

type InputAttributes = { value: string; error: string };
export interface IProjectFormProps extends HtmlHTMLAttributes<HTMLElement> {
  name: InputAttributes;
  privateProject: boolean;
  folders?: IProjectFolderListingItem[];
  folder?: IProjectFolder | null;
  allowFolderCreation?: boolean;
  currentFolderId?: string;
  setName: (item: string) => void;
  setPrivate: (item: boolean) => void;
  onChangeFolder?: (id: string) => void;
}
