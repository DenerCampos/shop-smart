import { Injectable } from '@nestjs/common';
import { Coupon } from './entities/coupon.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { ICouponRepository } from './contracts/coupon.repository.interface';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { Item } from './entities/item.entity';
import { Store } from 'src/store/entities/store.entity';
import { Group } from 'src/group/entities/group.entity';
import { CouponModel } from './model/coupon.model';
import { Payment } from 'src/payment/entities/payment.entity';

@Injectable()
export class CouponRepository implements ICouponRepository {
  constructor(
    private dataSource: DataSource,
    private couponEntity: Repository<Coupon>,
    private itemEntity: Repository<Item>,
    private storeEntity: Repository<Store>,
    private groupEntity: Repository<Group>,
    private paymentEntity: Repository<Payment>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<CouponModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { items, store, payment, ...couponData } = createCouponDto;

      // Store create
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
        savedStore = await queryRunner.manager.save(newStore);
      }

      // Payment create
      const paymentDb = await this.paymentEntity.findOne({
        where: {
          name: ILike(`%${payment.name}%`),
        },
      });

      let savedPayment: Payment;
      if (paymentDb) {
        savedPayment = paymentDb;
      } else {
        const newPayment = this.paymentEntity.create(payment);
        savedPayment = await queryRunner.manager.save(newPayment);
      }

      const coupon = this.couponEntity.create(couponData);
      coupon.store = savedStore;
      coupon.payment = savedPayment;

      await queryRunner.manager.save(coupon);

      //verifica se foi criado antes do commit do banco
      const createGroups: Group[] = [];
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
          //verifica se foi criado antes do commit do banco
          const hasCreateGroup = createGroups.find(
            (groupfind) => groupfind.name === group.name,
          );
          if (hasCreateGroup) {
            savedGroup = hasCreateGroup;
          } else {
            const newGroup = this.groupEntity.create(group);
            savedGroup = await queryRunner.manager.save(newGroup);
            createGroups.push(savedGroup);
          }
        }

        const newItem = this.itemEntity.create(itemData);
        newItem.coupon = coupon;
        newItem.group = savedGroup;

        await queryRunner.manager.save(newItem);
        savedItems.push(newItem);
      }
      coupon.items = savedItems;

      await queryRunner.commitTransaction();

      return new CouponModel(coupon);
    } catch (error) {
      console.log('error :', error);

      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  async findAll(): Promise<CouponModel[] | []> {
    const coupons = await this.couponEntity
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.items', 'items')
      .leftJoinAndSelect(
        'items.group',
        'group',
        'group.deletedAt IS NOT NULL OR group.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'coupon.store',
        'store',
        'store.deletedAt IS NOT NULL OR store.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'coupon.payment',
        'payment',
        'payment.deletedAt IS NOT NULL OR payment.deletedAt IS NULL',
      )
      .getMany();

    if (coupons) {
      return coupons.map((coupon) => new CouponModel(coupon));
    } else {
      return [];
    }
  }

  async find(id: string): Promise<CouponModel | null> {
    const coupon = await this.couponEntity
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.items', 'items')
      .leftJoinAndSelect(
        'items.group',
        'group',
        'group.deletedAt IS NOT NULL OR group.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'coupon.store',
        'store',
        'store.deletedAt IS NOT NULL OR store.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'coupon.payment',
        'payment',
        'payment.deletedAt IS NOT NULL OR payment.deletedAt IS NULL',
      )
      .where('coupon.id = :id', { id })
      .getOne();

    if (coupon) {
      return new CouponModel(coupon);
    } else {
      return null;
    }
  }

  // fazer o update
  async update(
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponModel | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const coupon = await this.couponEntity.findOneBy({ id });

      const { items, store, payment, ...updateCouponData } = updateCouponDto;

      // console.log('store: ', store);

      // update our create new store
      if (store !== undefined) {
        const storeDb = await this.storeEntity.findOne({
          where: {
            name: ILike(`%${store.name}%`),
          },
        });

        let updateStore: Store;
        if (storeDb) {
          updateStore = this.storeEntity.create({ ...storeDb, ...store });
          updateStore = await queryRunner.manager.save(updateStore);
        } else {
          const newStore = this.storeEntity.create(store);
          updateStore = await queryRunner.manager.save(newStore);
        }
        coupon.store = updateStore;
      }

      // update our create new payment
      if (payment !== undefined) {
        const paymentDb = await this.paymentEntity.findOne({
          where: {
            name: ILike(`%${payment.name}%`),
          },
        });

        let updatePayment: Payment;
        if (paymentDb) {
          updatePayment = this.paymentEntity.create({
            ...paymentDb,
            ...payment,
          });
          updatePayment = await queryRunner.manager.save(updatePayment);
        } else {
          const newPayment = this.paymentEntity.create(payment);
          updatePayment = await queryRunner.manager.save(newPayment);
        }
        coupon.payment = updatePayment;
      }

      // console.log('coupon: ', coupon);
      // console.log('update: ', updateCouponData);

      const updateCoupon = this.couponEntity.create({
        ...coupon,
        ...updateCouponData,
      });
      // console.log('updateCoupon: ', updateCoupon);

      await queryRunner.manager.save(updateCoupon);

      // console.log('items: ', items);

      // update our create news items
      if (items !== undefined) {
        const savedItems: Item[] = [];

        for (const item of items) {
          const { group, ...itemData } = item;

          // console.log('group: ', group);
          // console.log('itemData: ', itemData);

          if (itemData !== undefined) {
            // console.log(
            //   'itemData.id === undefined -> ',
            //   itemData.id === undefined,
            // );
            if (itemData.id === undefined) {
              const newItem = this.itemEntity.create(itemData);
              newItem.coupon = coupon;

              const groupDb = await this.groupEntity.findOne({
                where: {
                  name: ILike(`%${group.name}%`),
                },
              });

              // console.log('groupDb: ', groupDb);

              let updateGroup: Group;
              if (groupDb) {
                updateGroup = groupDb;
              } else {
                const newGroup = this.groupEntity.create(group);
                updateGroup = await queryRunner.manager.save(newGroup);
              }

              newItem.group = updateGroup;

              const savedItem = await queryRunner.manager.save(newItem);

              // console.log('newItem: ', savedItem);

              savedItems.push(savedItem);
            } else {
              const itemDb = await this.itemEntity.findOne({
                where: {
                  id: item.id,
                },
                relations: {
                  group: true,
                },
              });

              if (itemDb) {
                const updateItem = this.itemEntity.create({
                  ...itemDb,
                  ...itemData,
                });

                if (group !== undefined) {
                  const groupDb = await this.groupEntity.findOne({
                    where: {
                      name: ILike(`%${group.name}%`),
                    },
                  });

                  let updateGroup: Group;
                  if (groupDb) {
                    updateGroup = groupDb;
                  } else {
                    const newGroup = this.groupEntity.create(group);
                    updateGroup = await queryRunner.manager.save(newGroup);
                  }

                  updateItem.group = updateGroup;
                }

                const savedItem = await queryRunner.manager.save(updateItem);
                savedItems.push(savedItem);
              }
            }
          }
        }

        coupon.items = savedItems;
      }

      // console.log('coupon saved: ', coupon);

      await queryRunner.commitTransaction();

      return new CouponModel(coupon);
    } catch (error) {
      console.log('error :', error);

      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    }
  }

  async remove(id: string): Promise<CouponModel | null> {
    const coupon = await this.couponEntity.findOneBy({ id });

    if (coupon) {
      const removeCoupon = await this.couponEntity.remove(coupon);
      return new CouponModel(removeCoupon);
    } else {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    // TODO: o cascade delete não esta funcionado. verificar
    const result = await this.couponEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
