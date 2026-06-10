import { groupType } from 'src/group/types/groupType';

export type itemType = {
  id?: string;
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: number;
  total: number;
  warrantyDuration?: number | null;
  warrantyUnit?: 'days' | 'months' | 'years' | null;
  warrantyExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  group?: groupType;
};
