export const removeSpaceFromString = (str: string) =>
  str
    .split(' ')
    .filter((e) => e)
    .join(' ');

export const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const usernameRegex = /^[a-zA-Z0-9_-]{0,}$/;

export const usernameChecker = (value: string, minLength = 8) => {
  const sanitizedValue = removeSpaceFromString(removeAccents(value));
  return usernameRegex.test(sanitizedValue) && sanitizedValue.length >= minLength;
};

export const generateUsername = (name: string) => {
  const sanitizedValue = removeSpaceFromString(removeAccents(name.toLocaleLowerCase()));
  return sanitizedValue
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/, '-')
    .replace(/\s+/g, '');
};
