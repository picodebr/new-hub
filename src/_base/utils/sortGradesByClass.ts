import { IHubClass } from '../interfaces/class';

type FuncType = (classes: IHubClass[]) => IHubClass[];

// export const sortGradesByClass: FuncType = (classes) => {
//   // const grades = classes.map((c) => ({grade: c.grade, id: c.id}));
//   const numbers = classes.filter((grade) => !isNaN(Number(grade.grade)));
//   const EM_grades = classes.filter((grade) => !numbers.find((e) => grade.grade === e.grade) && grade.grade.endsWith(`EM`));
//   const others = classes.filter((grade) => !numbers.find((e) => grade.grade === e.grade) && !EM_grades.find((e) => grade.grade === e.grade));
//   return [...sorting(others), ...sorting(numbers), ...sorting(EM_grades)];
// };

// const sorting: FuncType = (classes) =>
//   classes.sort((a, b) =>
//     isNaN(Number(a.grade))
//       ? isNaN(parseInt(getNum(a.grade) || ``, 10))
//         ? -1
//         : parseInt(getNum(a.grade) || ``, 10) - parseInt(getNum(b.grade) || ``, 10) || 1
//       : Number(a.grade) - Number(b.grade),
//   );

// const getNum = (v: string) => v.match(/\d+/g)?.join(``);

const GRADE_ORDER = [
  'G3',
  'G4',
  'G5',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '1EM',
  '2EM',
  '3EM',
  'MakersPro Mini',
  'MakersPro Explorers',
  'MakersPro Creators',
  'MakersPro Innovators',
  'MakersPro Experts',
];

const getIndex = (grade?: string) => {
  const index = GRADE_ORDER.indexOf(grade || '');
  return index === -1 ? 999 : index;
};

export const sortGradesByClass = <T extends { grade?: string | null }>(classes: T[]): T[] =>
  [...classes].sort((a, b) => getIndex(a.grade || '') - getIndex(b.grade || ''));
