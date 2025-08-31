import { Provider } from '@nestjs/common';
import { EventEmitter } from 'events';

export const EventEmitterProvider: Provider = {
  provide: EventEmitter,
  useValue: new EventEmitter(),
};
