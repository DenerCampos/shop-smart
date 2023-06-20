import { Item } from '../entities/item.entity';

export interface IItemRepository {
  create(newItem: Item): Promise<Item>;
  findAll(): Promise<Item[]>;
  find(id: number): Promise<Item>;
  update(id: number, updateItem: Item): Promise<Item>;
  remove(id: number): Promise<Item>;
  delete(id: number): Promise<boolean>;
}
