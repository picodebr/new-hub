export const hubModuleLessonTypes = <const>['video', 'quiz', 'map', 'algorithm'];

export type HubModuleLessonType = (typeof hubModuleLessonTypes)[number];
