export const hubUserTypes = <const>['student', 'teacher'];

export type HubUserType = (typeof hubUserTypes)[number];
