import { Injectable } from '@nestjs/common';
import { ItemRepository } from './item.repository';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemModel } from './model/item.model';

@Injectable()
export class ItemService {
  constructor(private itemRepository: ItemRepository) {}

  async create(createItemDto: CreateItemDto): Promise<ItemModel> {
    const { id, name } = await this.itemRepository.create(createItemDto);
    return new ItemModel({ id, name });
  }

  async findAll(): Promise<ItemModel[]> {
    const items = await this.itemRepository.findAll();
    return items.map(({ id, name }) => new ItemModel({ id, name }));
  }

  async find(itemId: number): Promise<ItemModel> {
    const { id, name } = await this.itemRepository.find(itemId);
    return new ItemModel({ id, name });
  }

  async update(
    itemId: number,
    updateItemDto: UpdateItemDto,
  ): Promise<ItemModel> {
    const { id, name } = await this.itemRepository.update(
      itemId,
      updateItemDto,
    );
    return new ItemModel({ id, name });
  }

  async remove(itemId: number): Promise<ItemModel> {
    const { id, name } = await this.itemRepository.remove(itemId);
    return new ItemModel({ id, name });
  }

  async delete(itemId: number): Promise<boolean> {
    return await this.itemRepository.delete(itemId);
  }
}
