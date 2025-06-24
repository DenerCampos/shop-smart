import { registrarionsType } from '../types/profileType';

export class RegistrationModel {
  id: string;
  name: string;
  value: number;
  coins: number;
  type: registrarionsType;
  date: Date;

  constructor(data: Partial<RegistrationModel>) {
    this.id = data.id;
    this.name = data.name;
    this.value = data.value;
    this.coins = data.coins;
    this.type = data.type;
    this.date = data.date;
  }
}
