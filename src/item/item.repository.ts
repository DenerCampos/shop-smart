import { Injectable } from '@nestjs/common';
import { Item } from './entities/item.entity';
import { Repository } from 'typeorm';
import { IItemRepository } from './contracts/item.repository.interface';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemRepository implements IItemRepository {
  constructor(private itemEntity: Repository<Item>) {}
  async create(createItemDto: CreateItemDto): Promise<Item> {
    const item = this.itemEntity.create(createItemDto);

    return this.itemEntity.save(item);
  }
  async findAll(): Promise<Item[]> {
    return this.itemEntity.find();
  }
  async find(id: number): Promise<Item> {
    return this.itemEntity.findOneBy({ id });
  }
  async update(id: number, updateItemDto: UpdateItemDto): Promise<Item> {
    const item = await this.itemEntity.findOneBy({ id });

    return this.itemEntity.save({ ...item, ...updateItemDto });
  }
  async remove(id: number): Promise<Item> {
    const item = await this.itemEntity.findOneBy({ id });

    return this.itemEntity.remove(item);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.itemEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
