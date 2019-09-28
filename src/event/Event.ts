import { IEvent } from '../types';

export class Event {
  hash: IEvent['hash'];
  event: IEvent['event'];
  socket: IEvent['socket'];

  constructor(
    hash: IEvent['hash'],
    event: IEvent['event'],
    socket: IEvent['socket']
  ) {
    this.hash = hash;
    this.event = event;
    this.socket = socket;
  }

  reply(event: string, ...args: (string | object)[]) {
    this.socket.emit(event, ...args);
  }
}
