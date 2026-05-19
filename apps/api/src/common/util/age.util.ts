/**
 * Whole months between a date of birth and a reference date.
 * Never negative. Used to match a child to an age-banded questionnaire.
 */
export function ageInMonths(dateOfBirth: Date, at: Date = new Date()): number {
  let months =
    (at.getFullYear() - dateOfBirth.getFullYear()) * 12 +
    (at.getMonth() - dateOfBirth.getMonth());
  if (at.getDate() < dateOfBirth.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}
