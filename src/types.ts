export interface IEvent {
  hash: string;
  event:
    | string
    | {
        name: string;
        data: any;
      };
  socket: SocketIO.Socket | SocketIOClient.Socket;
}
