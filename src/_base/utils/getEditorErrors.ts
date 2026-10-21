/* eslint-disable no-unsafe-optional-chaining */
type FuncType = (err: any) => ICodeEditorError[];

export const getEditorErrors: FuncType = (err) => {
  const errorMessageArray: string[] =
    err?.response?.data?.message
      ?.split('\n')
      .slice(1, -1)
      .filter((e: string) => e.startsWith('/home'))
      .filter((e: string) => !!e.split(' ').find((s) => s.startsWith('error'))) || [];

  const targetErrorMessages: ICodeEditorError[] = errorMessageArray.map((e) => {
    const [line, column] = e.split('ino:')[1]?.split(':').slice(0, 2);

    return {
      line: parseInt(line),
      column: parseInt(column),
      message: `error: ${e.split('error:')[1]?.split('\n')[0]?.trim()}`,
    };
  });

  return targetErrorMessages;
};

export interface ICodeEditorError {
  line: number;
  column: number;
  message: string;
}
