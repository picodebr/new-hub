type FormateShortName = (name: string, showLastName?: boolean) => string;

export const formatShortName: FormateShortName = (name, showLastName) => {
  const m = name.split(' ');
  const names = m
    .slice(0, m.slice(0, 2).find((s) => s.length <= 3) ? 3 : 2)
    .map((s) => `${s.slice(0, 1).toUpperCase()}${s.slice(1, s.length).toLowerCase()}`);

  if (m.length > 1 && !showLastName) {
    const lastName = `${names.pop()?.charAt(0).toUpperCase()}.`;
    names.push(lastName);
  }

  return names.join(' ');
};
