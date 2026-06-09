import { User } from 'src/user/entities/user.entity';
import { registrarionsType } from '../types/profileType';

export class RegistrationModel {
  id: string;
  name: string;
  value: number;
  coins: number;
  type: registrarionsType;
  date: Date;
  user: User;
  isInstallment?: boolean;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
  installmentLabel?: string | null;

  constructor(data: Partial<RegistrationModel>) {
    this.id = data.id;
    this.name = data.name;
    this.value = data.value;
    this.coins = data.coins;
    this.type = data.type;
    this.date = data.date;
    this.user = data.user;
    this.isInstallment = data.isInstallment;
    this.installmentNumber = data.installmentNumber;
    this.totalInstallments = data.totalInstallments;
    this.installmentLabel = data.installmentLabel;
  }
}
