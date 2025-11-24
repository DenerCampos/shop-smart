import { AudioRecognition } from '../entities/audioRecognition.entity';
import { EntityManager } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

export interface IAudioRecognitionRepository {
  create(
    data: Partial<AudioRecognition>,
    user: User,
    manager?: EntityManager,
  ): Promise<AudioRecognition>;
}
