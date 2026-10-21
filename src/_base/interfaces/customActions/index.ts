export type CustomActions = { type: CustomActionType; data: IRedirectLinkActionData; school_id?: string | null };

export const customActionTypes = <const>['redirect_link'];

export type CustomActionType = (typeof customActionTypes)[number];

export interface IRedirectLinkActionData {
  icon: string;
  label: string;
  link: string;
}
