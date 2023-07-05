import { Item } from '../entities/item.entity';

export interface IItemRepository {
  create(newItem: Item): Promise<Item>;
  findAll(): Promise<Item[]>;
  find(id: string): Promise<Item>;
  update(id: string, updateItem: Item): Promise<Item>;
  remove(id: string): Promise<Item>;
  delete(id: string): Promise<boolean>;
}
