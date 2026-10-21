import { IProjectSourceCode, SourceCodeMode } from '../interfaces/codeProject/IProject';

export type ScratchTranspilerLanguage = 'cpp' | 'js';

type SourceCodeParser = (sourceCode: IProjectSourceCode, outputLang?: ScratchTranspilerLanguage) => string;

const textParser: SourceCodeParser = (sourceCode) => sourceCode.code;

const blockParser: SourceCodeParser = (sourceCode, _outputLang = 'cpp') => {
  return sourceCode.code;
};

const sourceCodeParsers: Record<SourceCodeMode, SourceCodeParser> = {
  text: textParser,
  block: blockParser,
};

export const parseSourceCode: SourceCodeParser = (sourceCode, outputLang = 'cpp') => {
  const parser = sourceCodeParsers[sourceCode.mode] || textParser;
  return parser(sourceCode, outputLang);
};
