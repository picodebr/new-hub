export function deepCopy<T>(e: T): T {
  if (Array.isArray(e)) return e.map(i => deepCopy(i)) as unknown as T;

  if (typeof e !== 'object' || !e) return e;

  const newObj = {} as T;

  Object.keys(e).forEach(
    k => (newObj[k as keyof T] = deepCopy(e[k as keyof T])),
  );

  return newObj;
}
