export function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function readNullableString(value: unknown) {
  const text = readString(value);
  return text ? text : null;
}

export function readNullableInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : undefined;
}
