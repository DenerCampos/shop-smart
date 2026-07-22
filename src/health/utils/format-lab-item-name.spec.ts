import { formatLabItemDisplayName } from './format-lab-item-name';

describe('formatLabItemDisplayName', () => {
  it('aplica Title Case por palavra', () => {
    expect(formatLabItemDisplayName('UREIA')).toBe('Ureia');
    expect(formatLabItemDisplayName('colesterol hdl')).toBe('Colesterol Hdl');
    expect(formatLabItemDisplayName('neutrofilos bastonetes')).toBe(
      'Neutrofilos Bastonetes',
    );
  });

  it('preserva sufixos entre parênteses', () => {
    expect(formatLabItemDisplayName('hemácias (hemograma)')).toBe(
      'Hemácias (Hemograma)',
    );
    expect(formatLabItemDisplayName('PROTEINÚRIA 24H (URINA)')).toBe(
      'Proteinúria 24h (Urina)',
    );
  });

  it('ignora espaços extras e string vazia', () => {
    expect(formatLabItemDisplayName('  plaquetas  ')).toBe('Plaquetas');
    expect(formatLabItemDisplayName('   ')).toBe('');
  });
});
