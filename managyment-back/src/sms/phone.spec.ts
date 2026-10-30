import { toE164 } from './phone';

describe('toE164', () => {
  it('converts a 11-digit mobile number to +55', () => {
    expect(toE164('34997467405')).toBe('+5534997467405');
  });

  it('converts a masked 10-digit number', () => {
    expect(toE164('(34) 3746-7405')).toBe('+553437467405');
  });

  it('returns null for empty or malformed numbers', () => {
    expect(toE164('')).toBeNull();
    expect(toE164('123')).toBeNull();
  });
});
