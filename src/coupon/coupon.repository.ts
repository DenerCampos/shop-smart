import { Injectable } from '@nestjs/common';
import { Coupon } from './entities/coupon.entity';
import { ILike, Repository } from 'typeorm';
import { ICouponRepository } from './contracts/coupon.repository.interface';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { Item } from './entities/item.entity';
import { Store } from 'src/store/entities/store.entity';
import { Group } from 'src/group/entities/group.entity';
import { CouponModel } from './model/coupon.model';
import { Payment } from 'src/payment/entities/payment.entity';
import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';
import { storeType } from 'src/store/types/storeType';
import { paymentType } from 'src/payment/types/paymentType';
import { groupType } from 'src/group/types/groupType';

@Injectable()
export class CouponRepository implements ICouponRepository {
  private createGroups: Group[] = [];
  private savedItems: Item[] = [];

  constructor(
    private queryRunner: QueryRunnerFactory,
    private couponEntity: Repository<Coupon>,
    private itemEntity: Repository<Item>,
    private storeEntity: Repository<Store>,
    private groupEntity: Repository<Group>,
    private paymentEntity: Repository<Payment>,
  ) {}

  private resetControllers(): void {
    this.createGroups = [];
    this.savedItems = [];
  }

  private async getStore(name: string): Promise<Store | null> {
    const store = await this.storeEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
      },
    });

    return store;
  }

  private async createStore(store: Store | storeType): Promise<Store> {
    const storeDb = await this.getStore(store.name);

    let savedStore: Store;
    if (storeDb) {
      savedStore = storeDb;
    } else {
      const newStore = this.storeEntity.create(store);
      savedStore = await this.queryRunner.manager.save(newStore);
    }

    return savedStore;
  }

  private async updateStore(store: Store | storeType): Promise<Store> {
    const storeDb = await this.getStore(store.name);

    let updateStore: Store;
    if (storeDb) {
      updateStore = this.storeEntity.create({ ...storeDb, ...store });
      updateStore = await this.queryRunner.manager.save(updateStore);
    } else {
      const newStore = this.storeEntity.create(store);
      updateStore = await this.queryRunner.manager.save(newStore);
    }

    return updateStore;
  }

  private async getPayment(name: string): Promise<Payment | null> {
    const payment = await this.paymentEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
      },
    });

    return payment;
  }

  private async createPayment(
    payment: Payment | paymentType,
  ): Promise<Payment> {
    const paymentDb = await this.getPayment(payment.name);

    let savedPayment: Payment;
    if (paymentDb) {
      savedPayment = paymentDb;
    } else {
      const newPayment = this.paymentEntity.create(payment);
      savedPayment = await this.queryRunner.manager.save(newPayment);
    }

    return savedPayment;
  }

  private async updatePayment(
    payment: Payment | paymentType,
  ): Promise<Payment> {
    const paymentDb = await this.getPayment(payment.name);

    let updatePayment: Payment;
    if (paymentDb) {
      updatePayment = this.paymentEntity.create({
        ...paymentDb,
        ...payment,
      });
      updatePayment = await this.queryRunner.manager.save(updatePayment);
    } else {
      const newPayment = this.paymentEntity.create(payment);
      updatePayment = await this.queryRunner.manager.save(newPayment);
    }

    return updatePayment;
  }

  private async getGroup(name: string): Promise<Group | null> {
    const group = await this.groupEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
      },
    });

    return group;
  }

  private async createGroup(group: Group | groupType): Promise<Group> {
    const groupDb = await this.getGroup(group.name);

    let savedGroup: Group;
    if (groupDb) {
      savedGroup = groupDb;
    } else {
      //verifica se foi criado antes do commit do banco
      const hasCreateGroup = this.createGroups.find(
        (groupfind) => groupfind.name === group.name,
      );
      if (hasCreateGroup) {
        savedGroup = hasCreateGroup;
      } else {
        const newGroup = this.groupEntity.create(group);
        savedGroup = await this.queryRunner.manager.save(newGroup);
        this.createGroups.push(savedGroup);
      }
    }

    return savedGroup;
  }

  private async getItem(id: string): Promise<Item | null> {
    const group = await this.itemEntity.findOne({
      where: {
        id: id,
      },
      relations: {
        group: true,
      },
    });

    return group;
  }

  async create(createCouponDto: CreateCouponDto): Promise<CouponModel> {
    await this.queryRunner.startTransaction();

    try {
      const { items, store, payment, ...couponData } = createCouponDto;

      // Store create
      const savedStore = await this.createStore(store);

      // Payment create
      const savedPayment = await this.createPayment(payment);

      const coupon = this.couponEntity.create(couponData);
      coupon.store = savedStore;
      coupon.payment = savedPayment;

      await this.queryRunner.manager.save(coupon);

      // Items create
      for (const item of items) {
        const { group, ...itemData } = item;

        // Group create
        const savedGroup = await this.createGroup(group);

        const newItem = this.itemEntity.create(itemData);
        newItem.coupon = coupon;
        newItem.group = savedGroup;

        await this.queryRunner.manager.save(newItem);
        this.savedItems.push(newItem);
      }
      coupon.items = this.savedItems;

      await this.queryRunner.commitTransaction();

      return new CouponModel(coupon);
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      this.resetControllers();
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

  async update(
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponModel | null> {
    await this.queryRunner.startTransaction();

    try {
      const coupon = await this.couponEntity.findOneBy({ id });

      const { items, store, payment, ...updateCouponData } = updateCouponDto;

      // update our create new store
      if (store !== undefined) {
        const updateStore = await this.updateStore(store);
        coupon.store = updateStore;
      }

      // update our create new payment
      if (payment !== undefined) {
        const updatePayment = await this.updatePayment(payment);
        coupon.payment = updatePayment;
      }

      const updateCoupon = this.couponEntity.create({
        ...coupon,
        ...updateCouponData,
      });

      await this.queryRunner.manager.save(updateCoupon);

      // update our create news items
      if (items !== undefined) {
        for (const item of items) {
          const { group, ...itemData } = item;

          if (itemData !== undefined) {
            if (itemData.id === undefined) {
              const newItem = this.itemEntity.create(itemData);
              newItem.coupon = coupon;

              const createGroup = await this.createGroup(group);
              newItem.group = createGroup;

              const savedItem = await this.queryRunner.manager.save(newItem);

              this.savedItems.push(savedItem);
            } else {
              const itemDb = await this.getItem(item.id);

              if (itemDb) {
                const updateItem = this.itemEntity.create({
                  ...itemDb,
                  ...itemData,
                });

                if (group !== undefined) {
                  const updateGroup = await this.createGroup(group);
                  updateItem.group = updateGroup;
                }

                const savedItem = await this.queryRunner.manager.save(
                  updateItem,
                );
                this.savedItems.push(savedItem);
              }
            }
          }
        }

        coupon.items = this.savedItems;
      }
      await this.queryRunner.commitTransaction();

      return new CouponModel(coupon);
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      this.resetControllers();
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
