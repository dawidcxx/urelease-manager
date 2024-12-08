export function mapOptional<T, U>(value: T | undefined, fn: (value: T) => U): U | undefined {
  return value ? fn(value) : undefined;
}
