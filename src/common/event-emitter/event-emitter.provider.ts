import { Provider } from '@nestjs/common';
import { EventEmitter } from 'events';

export const EVENT_EMITTER = 'EVENT_EMITTER';

export const EventEmitterProvider: Provider = {
  provide: EVENT_EMITTER,
  useFactory: () => {
    return new EventEmitter();
  },
};
