import { Injectable } from '@nestjs/common';
import { IImageRecognitionRepository } from '../interfaces/imageRecognition.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageRecognition } from '../entities/imageRecognition.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateImageRecognitionDto } from '../dto/create-image-recognition.dto';
@Injectable()
export class ImageRecognitionRepository implements IImageRecognitionRepository {
  constructor(
    @InjectRepository(ImageRecognition)
    private readonly imagerecognitionEntity: Repository<ImageRecognition>,
  ) {}

  async create(
    createImageRecognitionDto: CreateImageRecognitionDto,
    user: User,
    manager?: EntityManager,
  ): Promise<ImageRecognition> {
    if (!user?.id) {
      throw new Error('image_recognition: userId obrigatório para persistir análise');
    }

    const repository = manager
      ? manager.getRepository(ImageRecognition)
      : this.imagerecognitionEntity;

    const newImageRecognition = repository.create({
      ...createImageRecognitionDto,
      user,
    });

    return await repository.save(newImageRecognition);
  }
}
