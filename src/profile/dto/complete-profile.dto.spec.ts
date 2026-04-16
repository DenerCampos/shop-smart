import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CompleteProfileDto } from './complete-profile.dto';

describe('CompleteProfileDto (class-validator)', () => {
  const valid = {
    name: 'Renda',
    family: 'Silva',
    income: 3000,
    date: '2024-06-01',
    repeatMonthly: true,
  };

  it('aceita payload válido', async () => {
    const dto = plainToInstance(CompleteProfileDto, valid);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita quando name está vazio', async () => {
    const dto = plainToInstance(CompleteProfileDto, { ...valid, name: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita quando income não é número', async () => {
    const dto = plainToInstance(CompleteProfileDto, {
      ...valid,
      income: 'não-numero',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'income')).toBe(true);
  });
});
