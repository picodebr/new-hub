export type PostReaction = Record<PostReactionKey, string[]>;

export type PostReactionKey = (typeof postReactionKeys)[number];

export const postReactionKeys = <const>[`like`, `love`, `insightful`, `aid`];
