export const hubUserRoles = <const>['student', 'parent', 'teacher', 'principal', 'mayor', 'master'];

export type HubUserRole = (typeof hubUserRoles)[number];
