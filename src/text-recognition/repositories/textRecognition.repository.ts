import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { TextRecognition } from '../entities/textRecognition.entity';
import { ITextRecognitionRepository } from '../interfaces/textRecognition.repository.interface';

@Injectable()
export class TextRecognitionRepository implements ITextRecognitionRepository {
  constructor(
    @InjectRepository(TextRecognition)
    private readonly entity: Repository<TextRecognition>,
  ) {}

  async create(
    data: Partial<TextRecognition>,
    user: User,
    manager?: EntityManager,
  ): Promise<TextRecognition> {
    const repository = manager
      ? manager.getRepository(TextRecognition)
      : this.entity;

    const row = repository.create({
      ...data,
      user,
      userId: user.id,
    });

    return repository.save(row);
  }
}
