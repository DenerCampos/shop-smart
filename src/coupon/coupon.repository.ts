import { Injectable } from '@nestjs/common';
import { Coupon } from './entities/coupon.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { ICouponRepository } from './contracts/coupon.repository.interface';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { Item } from './entities/item.entity';
import { Store } from 'src/store/entities/store.entity';
import { Group } from 'src/group/entities/group.entity';

@Injectable()
export class CouponRepository implements ICouponRepository {
  constructor(
    private dataSource: DataSource,
    private couponEntity: Repository<Coupon>,
    private itemEntity: Repository<Item>,
    private storeEntity: Repository<Store>,
    private groupEntity: Repository<Group>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { items, store, ...couponData } = createCouponDto;

      const storeDb = await this.storeEntity.findOne({
        where: {
          name: ILike(`%${store.name}%`),
        },
      });

      let savedStore: Store;
      if (storeDb) {
        savedStore = storeDb;
      } else {
        const newStore = this.storeEntity.create(store);
        savedStore = await this.storeEntity.save(newStore);
      }

      const coupon = this.couponEntity.create(couponData);
      coupon.store = savedStore;

      await queryRunner.manager.save(coupon);

      const savedItems: Item[] = [];
      for (const item of items) {
        const { group, ...itemData } = item;

        const groupDb = await this.groupEntity.findOne({
          where: {
            name: ILike(`%${group.name}%`),
          },
        });

        let savedGroup: Group;
        if (groupDb) {
          savedGroup = groupDb;
        } else {
          const newGroup = this.groupEntity.create(group);
          savedGroup = await this.groupEntity.save(newGroup);
        }

        const newItem = this.itemEntity.create(itemData);
        newItem.coupon = coupon;
        newItem.group = savedGroup;

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

    const { items, store, ...updateCouponData } = updateCouponDto;

    if (store !== undefined) {
      const storeDb = await this.storeEntity.findOneBy({
        id: store.id,
      });
      if (storeDb === null) {
        //cria novo store
        throw new Error('store not found');
      }
      coupon.store = storeDb;
    }

    return this.couponEntity.save({ ...coupon, ...updateCouponData });
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
