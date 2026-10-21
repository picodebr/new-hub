export interface IQuizChallenge {
  text: string;
  is_correct: boolean;
}
export interface ISendQuizParams {
  hub_challenge_id: string;
  option: string;
}
