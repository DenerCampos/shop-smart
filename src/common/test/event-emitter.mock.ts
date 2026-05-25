import { EventEmitter } from 'events';
import { EVENT_EMITTER } from '../event-emitter/event-emitter.provider';

export function provideEventEmitterMock(): {
  provide: string;
  useValue: EventEmitter;
} {
  return { provide: EVENT_EMITTER, useValue: new EventEmitter() };
}
