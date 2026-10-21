export type FuncType = (grade: string) => string;

export const formatClassGrade: FuncType = (grade: string) =>
  isNaN(parseInt(grade)) ? `${grade}` : grade.toUpperCase().endsWith(`EM`) ? `${parseInt(grade)}º ANO E.M.` : `${grade}º ANO`;
