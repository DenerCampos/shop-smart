import { isAccessTokenStale } from '../jwt-access.util';

describe('isAccessTokenStale', () => {
  it('aceita JWT sem ver quando tokenVersion é 0', () => {
    expect(isAccessTokenStale({}, { tokenVersion: 0 })).toBe(false);
    expect(isAccessTokenStale({ ver: 0 }, {})).toBe(false);
  });

  it('rejeita JWT com ver menor que o da conta', () => {
    expect(isAccessTokenStale({ ver: 0 }, { tokenVersion: 1 })).toBe(true);
  });
});
