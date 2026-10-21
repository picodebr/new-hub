export interface ICreateHubFormClassUser {
  hub_user_id: string;
  hub_form_class_id: string;
  questions: IHubFormClassAnswers[];
}

export interface IHubFormClassAnswers {
  question_id: string;
  score: number;
}
