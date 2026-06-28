import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { HealthPrescription } from '../entities/health-prescription.entity';
import { HealthPrescriptionItem } from '../entities/health-prescription-item.entity';
import {
  HealthPrescriptionListResult,
  IHealthPrescriptionRepository,
} from '../interfaces/health-prescription.repository.interface';
import type { HealthPrescriptionFilterDto } from '../dto/health-prescription-filter.dto';

@Injectable()
export class HealthPrescriptionRepository implements IHealthPrescriptionRepository {
  constructor(
    @InjectRepository(HealthPrescription)
    private readonly rxEntity: Repository<HealthPrescription>,
    @InjectRepository(HealthPrescriptionItem)
    private readonly itemEntity: Repository<HealthPrescriptionItem>,
  ) {}

  private rx(manager?: EntityManager): Repository<HealthPrescription> {
    return manager ? manager.getRepository(HealthPrescription) : this.rxEntity;
  }

  private item(manager?: EntityManager): Repository<HealthPrescriptionItem> {
    return manager
      ? manager.getRepository(HealthPrescriptionItem)
      : this.itemEntity;
  }

  async create(
    data: Partial<HealthPrescription>,
    items: Partial<HealthPrescriptionItem>[],
    manager?: EntityManager,
  ): Promise<HealthPrescription> {
    const rxRepo = this.rx(manager);
    const itemRepo = this.item(manager);

    const rx = rxRepo.create(data);
    const saved = await rxRepo.save(rx);

    if (items.length) {
      const rxItems = items.map((i) =>
        itemRepo.create({ ...i, prescription: { id: saved.id } as any }),
      );
      await itemRepo.save(rxItems);
    }

    return this.findById(saved.id, manager) as Promise<HealthPrescription>;
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<HealthPrescription | null> {
    return this.rx(manager).findOne({
      where: { id, deletedAt: null as any },
      relations: ['items', 'user', 'createdBy'],
    });
  }

  async findAll(
    filter: HealthPrescriptionFilterDto,
    groupId: string | null,
    requestingUserId: string,
    manager?: EntityManager,
  ): Promise<HealthPrescriptionListResult> {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const offset = (page - 1) * limit;

    const qb = this.rx(manager)
      .createQueryBuilder('rx')
      .leftJoinAndSelect('rx.items', 'items')
      .leftJoinAndSelect('rx.user', 'user')
      .where('rx.deletedAt IS NULL');

    if (filter.userId) {
      if (groupId) qb.andWhere('rx.familyGroupId = :groupId', { groupId });
      qb.andWhere('rx.userId = :userId', { userId: filter.userId });
    } else if (groupId) {
      qb.andWhere('rx.familyGroupId = :groupId', { groupId });
    } else {
      qb.andWhere('rx.userId = :userId', { userId: requestingUserId });
    }

    qb.orderBy('rx.prescriptionDate', 'DESC').skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async save(
    rx: HealthPrescription,
    manager?: EntityManager,
  ): Promise<HealthPrescription> {
    return this.rx(manager).save(rx);
  }

  async replaceItems(
    prescriptionId: string,
    items: Partial<HealthPrescriptionItem>[],
    manager?: EntityManager,
  ): Promise<void> {
    const itemRepo = this.item(manager);
    await itemRepo.delete({ prescription: { id: prescriptionId } as any });
    if (items.length) {
      const newItems = items.map((i) =>
        itemRepo.create({
          ...i,
          prescription: { id: prescriptionId } as any,
        }),
      );
      await itemRepo.save(newItems);
    }
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    await this.rx(manager).softDelete(id);
  }
}
