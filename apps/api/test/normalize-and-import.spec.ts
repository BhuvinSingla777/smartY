import {
  normalizeKey,
  normalizePercentage,
  parseNullableNumber,
  parseFlexibleDate,
  overallCompletion,
  isAggregateMemberName,
} from '@bdg-pods/shared';

describe('normalizeKey', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeKey('Akshay Mishra')).toBe('akshay mishra');
    expect(normalizeKey(' akshay mishra ')).toBe('akshay mishra');
    expect(normalizeKey('AKSHAY MISHRA')).toBe('akshay mishra');
  });

  it('normalizes POD names', () => {
    expect(normalizeKey('TeleHealth')).toBe('telehealth');
    expect(normalizeKey(' telehealth ')).toBe('telehealth');
    expect(normalizeKey('TELEHEALTH')).toBe('telehealth');
  });
});

describe('isAggregateMemberName', () => {
  it('detects Total and similar aggregate labels', () => {
    expect(isAggregateMemberName('Total')).toBe(true);
    expect(isAggregateMemberName('TOTAL')).toBe(true);
    expect(isAggregateMemberName('Grand Total')).toBe(true);
    expect(isAggregateMemberName('Akshay Mishra')).toBe(false);
  });
});

describe('normalizePercentage', () => {
  it('accepts percent strings and decimals', () => {
    expect(normalizePercentage('85%')).toBe(85);
    expect(normalizePercentage(0.85)).toBe(85);
    expect(normalizePercentage(85)).toBe(85);
    expect(normalizePercentage('0.29')).toBe(29);
  });

  it('rejects invalid values', () => {
    expect(normalizePercentage('abc')).toBeNull();
    expect(normalizePercentage('')).toBeNull();
  });
});

describe('parseNullableNumber / dates', () => {
  it('parses numbers', () => {
    expect(parseNullableNumber('10')).toBe(10);
    expect(parseNullableNumber('-1')).toBe(-1);
  });

  it('parses flexible dates', () => {
    expect(parseFlexibleDate('24-Aug-2026')).toMatch(/^2026-08/);
  });
});

describe('overallCompletion', () => {
  it('averages available percentages', () => {
    expect(overallCompletion(50, 100, null)).toBe(75);
    expect(overallCompletion(null, null, null)).toBeNull();
  });
});
