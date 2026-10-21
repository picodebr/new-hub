export const hubStatuses = <const>['stopped', 'running', 'finished'];

export type HubStatus = (typeof hubStatuses)[number];
