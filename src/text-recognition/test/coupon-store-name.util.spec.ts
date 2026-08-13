import {
  GENERIC_COUPON_STORE_NAME,
  buildFallbackCouponStoreName,
  pickCouponStoreName,
} from '../utils/coupon-store-name.util';

describe('coupon-store-name.util', () => {
  describe('pickCouponStoreName', () => {
    it('retorna o primeiro candidato preenchido, sem espaços', () => {
      expect(pickCouponStoreName('  Mercado Bom Preço ')).toBe(
        'Mercado Bom Preço',
      );
      expect(pickCouponStoreName('', '  ', 'Padaria')).toBe('Padaria');
    });

    it('retorna null quando nenhum candidato é válido', () => {
      expect(pickCouponStoreName(null, undefined, '', '   ', 42)).toBeNull();
    });
  });

  describe('buildFallbackCouponStoreName', () => {
    it('usa a categoria predominante dos itens', () => {
      const items = [
        { group: { name: 'Alimentação' } },
        { group: { name: 'Limpeza' } },
        { group: { name: 'Alimentação' } },
      ];

      expect(buildFallbackCouponStoreName(items)).toBe('Compra de Alimentação');
    });

    it('ignora itens sem categoria válida', () => {
      const items = [
        { group: { name: '   ' } },
        null,
        { group: { name: 'Higiene' } },
      ];

      expect(buildFallbackCouponStoreName(items)).toBe('Compra de Higiene');
    });

    it('usa nome genérico sem itens ou sem categorias', () => {
      expect(buildFallbackCouponStoreName([])).toBe(GENERIC_COUPON_STORE_NAME);
      expect(buildFallbackCouponStoreName(undefined)).toBe(
        GENERIC_COUPON_STORE_NAME,
      );
      expect(buildFallbackCouponStoreName([{ name: 'Arroz' }])).toBe(
        GENERIC_COUPON_STORE_NAME,
      );
    });

    it('em empate de contagem, vence a categoria que aparece primeiro', () => {
      const items = [
        { group: { name: 'Alimentação' } },
        { group: { name: 'Limpeza' } },
        { group: { name: 'Alimentação' } },
        { group: { name: 'Limpeza' } },
      ];

      expect(buildFallbackCouponStoreName(items)).toBe('Compra de Alimentação');
    });

    it('ignora categoria fora da allowlist e usa o genérico se nenhuma for válida', () => {
      const items = [
        { group: { name: 'Mercado Extra' } },
        { group: { name: 'Loja Inventada' } },
      ];

      expect(buildFallbackCouponStoreName(items)).toBe(
        GENERIC_COUPON_STORE_NAME,
      );
    });

    it('aceita categoria customizada da allowlist do usuário', () => {
      const items = [{ group: { name: 'Farmácia' } }];

      expect(
        buildFallbackCouponStoreName(items, ['Farmácia', 'Alimentação']),
      ).toBe('Compra de Farmácia');
    });

    it('casa categoria da IA com a allowlist ignorando maiúsculas e acento', () => {
      const items = [{ group: { name: 'alimentacao' } }];

      expect(buildFallbackCouponStoreName(items, ['Alimentação'])).toBe(
        'Compra de Alimentação',
      );
    });
  });
});
