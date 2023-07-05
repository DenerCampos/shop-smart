import { groupType } from 'src/group/types/groupType';

export type itemType = {
  id?: string;
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: number;
  total: number;
  purchaseDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  group?: groupType;
};
