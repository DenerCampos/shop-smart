import { Injectable } from '@nestjs/common';
import { IAudioRecognitionRepository } from '../interfaces/audioRecognition.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AudioRecognition } from '../entities/audioRecognition.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AudioRecognitionRepository implements IAudioRecognitionRepository {
  constructor(
    @InjectRepository(AudioRecognition)
    private readonly audioRecognitionEntity: Repository<AudioRecognition>,
  ) {}

  async create(
    data: Partial<AudioRecognition>,
    user: User,
    manager?: EntityManager,
  ): Promise<AudioRecognition> {
    const repository = manager
      ? manager.getRepository(AudioRecognition)
      : this.audioRecognitionEntity;

    const newAudioRecognition = repository.create({
      ...data,
      user,
      userId: user.id,
    });

    return await repository.save(newAudioRecognition);
  }
}
