import { User } from 'src/user/entities/user.entity';
import { coinType } from '../types/coinType';

export class CoinAddedEvent {
  constructor(
    public readonly user: User,
    public readonly type: coinType,
    public readonly metadata?: Record<string, any>,
  ) {}
}
