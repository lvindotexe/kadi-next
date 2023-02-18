export function isNotNullOrUndefined<T extends object>(
  input: null | undefined | T
): input is T {
  return input != null;
}

export function isAdept(name: string) {
  return ["harrowed", "adept", "timelost"].some((e) =>
    name.toLowerCase().includes(e)
  );
}
