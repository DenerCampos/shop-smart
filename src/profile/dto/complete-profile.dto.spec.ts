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

  it('aceita payload completo (com receita)', async () => {
    const dto = plainToInstance(CompleteProfileDto, valid);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('aceita payload apenas com family (sem receita)', async () => {
    const dto = plainToInstance(CompleteProfileDto, { family: 'Silva' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita quando family está ausente', async () => {
    const dto = plainToInstance(CompleteProfileDto, {
      name: 'Renda',
      income: 3000,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'family')).toBe(true);
  });

  it('aceita quando name está ausente sem income', async () => {
    const { name: _n, income: _i, ...rest } = valid;
    const dto = plainToInstance(CompleteProfileDto, rest);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita quando income está presente sem name', async () => {
    const dto = plainToInstance(CompleteProfileDto, {
      family: 'Silva',
      income: 3000,
      date: '2024-06-01',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita quando income está presente sem date', async () => {
    const dto = plainToInstance(CompleteProfileDto, {
      family: 'Silva',
      name: 'Renda',
      income: 3000,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'date')).toBe(true);
  });

  it('rejeita quando income está presente e name é vazio', async () => {
    const dto = plainToInstance(CompleteProfileDto, {
      ...valid,
      name: '',
    });
    const errors = await validate(dto);
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

  it('aceita quando income está ausente (campo opcional)', async () => {
    const { income: _i, ...withoutIncome } = valid;
    const dto = plainToInstance(CompleteProfileDto, withoutIncome);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'income')).toBe(false);
  });
});
