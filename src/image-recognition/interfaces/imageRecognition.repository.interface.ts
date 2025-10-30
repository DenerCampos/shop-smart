import { User } from 'src/user/entities/user.entity';
import { CreateImageRecognitionDto } from '../dto/create-image-recognition.dto';
import { ImageRecognition } from '../entities/imageRecognition.entity';
import { EntityManager } from 'typeorm';

export interface IImageRecognitionRepository {
  create(
    newImageRecognition: CreateImageRecognitionDto,
    user: User,
    manager?: EntityManager,
  ): Promise<ImageRecognition>;
}
