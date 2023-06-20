import { Injectable } from '@nestjs/common';
import { Coupon } from './entities/coupon.entity';
import { DataSource, Repository } from 'typeorm';
import { ICouponRepository } from './contracts/coupon.repository.interface';
import { CreateCouponDto } from './dto/create-coupan.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Item } from './entities/item.entity';

@Injectable()
export class CouponRepository implements ICouponRepository {
  constructor(
    private dataSource: DataSource,
    private couponEntity: Repository<Coupon>,
    private itemEntity: Repository<Item>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { items, ...couponData } = createCouponDto;
      const coupon = this.couponEntity.create(couponData);

      await queryRunner.manager.save(coupon);

      const savedItems: Item[] = [];
      for (const item of items) {
        const newItem = this.itemEntity.create(item);
        newItem.coupon = coupon;
        await queryRunner.manager.save(newItem);
        savedItems.push(newItem);
      }
      coupon.items = savedItems;

      await queryRunner.commitTransaction();

      return coupon;
    } catch (error) {
      console.log('error :', error);

      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    }
  }
  async findAll(): Promise<Coupon[]> {
    return this.couponEntity.find();
  }
  async find(id: number): Promise<Coupon> {
    return this.couponEntity.findOneBy({ id });
  }
  async update(id: number, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponEntity.findOneBy({ id });

    return this.couponEntity.save({ ...coupon, ...updateCouponDto });
  }
  async remove(id: number): Promise<Coupon> {
    const coupon = await this.couponEntity.findOneBy({ id });

    return this.couponEntity.remove(coupon);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.couponEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
