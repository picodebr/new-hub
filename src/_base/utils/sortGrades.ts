type FuncType = (grades: string[]) => string[];

export const sortGrades: FuncType = (grades) => {
  const numbers = grades.filter((grade) => !isNaN(Number(grade)));
  const EM_grades = grades.filter((grade) => !numbers.includes(grade) && grade.endsWith(`EM`));
  const others = grades.filter((grade) => !numbers.includes(grade) && !EM_grades.includes(grade));

  return [...sorting(others), ...sorting(numbers), ...sorting(EM_grades)];
};

const sorting: FuncType = (grades) =>
  grades.sort((a, b) =>
    isNaN(Number(a))
      ? isNaN(parseInt(getNum(a) || ``, 10))
        ? -1
        : parseInt(getNum(a) || ``, 10) - parseInt(getNum(b) || ``, 10) || 1
      : Number(a) - Number(b),
  );

const getNum = (v: string) => v.match(/\d+/g)?.join(``);
