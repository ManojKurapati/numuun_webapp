import { ageInMonths } from './age.util';

describe('ageInMonths', () => {
  it('returns whole months between birth and reference date', () => {
    expect(ageInMonths(new Date('2024-01-15'), new Date('2024-07-15'))).toBe(6);
  });

  it('does not count a month until the day-of-month is reached', () => {
    expect(ageInMonths(new Date('2024-01-20'), new Date('2024-07-15'))).toBe(5);
  });

  it('counts full years correctly', () => {
    expect(ageInMonths(new Date('2022-03-10'), new Date('2024-03-10'))).toBe(24);
  });

  it('never returns a negative age', () => {
    expect(ageInMonths(new Date('2025-01-01'), new Date('2024-01-01'))).toBe(0);
  });
});
