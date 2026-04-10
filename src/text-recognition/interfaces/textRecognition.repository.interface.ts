import { EntityManager } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { TextRecognition } from '../entities/textRecognition.entity';

export interface ITextRecognitionRepository {
  create(
    data: Partial<TextRecognition>,
    user: User,
    manager?: EntityManager,
  ): Promise<TextRecognition>;
}
