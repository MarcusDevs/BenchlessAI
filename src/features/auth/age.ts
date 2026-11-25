/** Year-only age gate uses a conservative cutoff and never assumes an unprovided birthday. */
export function isAdultBirthYear(birthYear: string, currentYear = new Date().getFullYear()): boolean {
  if (!/^\d{4}$/.test(birthYear)) return false;
  const year = Number(birthYear);
  return year >= 1900 && year <= currentYear - 19;
}
