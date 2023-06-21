export type itemType = {
  id?: number;
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
  groupId?: number;
};
