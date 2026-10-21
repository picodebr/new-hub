export interface IChallengesConfig {
  daily_challenges: {
    consistency_bonus: Record<number, ConsistencyBonusType>;
  };
}

export type ConsistencyBonusType = { coins: number; extra: { lifes?: number } };
