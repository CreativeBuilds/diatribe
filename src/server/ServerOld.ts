import express from 'express';
import SocketIO from 'socket.io';
import HTTP from 'http';
import { AddressInfo } from 'net';
import ClientIo from 'socket.io-client';
import rxjs, { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Event } from '../event/Event';
import colors from 'colors';
import crypto from 'crypto';
import { IEvent } from '../types';

export class Server {
  //port of server
  port: number;
  //SocketIO app
  app = express();
  //HTTP Server
  http: HTTP.Server;
  //Websocket Server
  io: SocketIO.Server;
  //List of connected servers
  online: boolean;
  //Pipeline of events
  events: BehaviorSubject<Event>;
  //Event Hashes that have already happened and should be ignored
  processedHashes: { [hash: string]: number };
  //Current connected servers
  connectedServers: { [ip: string]: SocketIOClient.Socket };
  eventListener: rxjs.Subscription;

  constructor(port: number) {
    //Create the HTTP Server locally
    this.http = HTTP.createServer(this.app);
    //assign the websocket to the same port as the http server
    this.io = SocketIO(this.http);
    //Start up the hashes map
    this.processedHashes = {};
    //Start up the servers map
    this.connectedServers = {};
    //Start the pipeline for events
    this.events = new BehaviorSubject(null);
    this.port = port;

    //Start the http server on a specified port
    this.http.listen(port, () => {
      const address = <AddressInfo>this.http.address();
      this.online = true;
      console.log(`listening on *:${address.port}`);
    });

    //On websocket connection (Another server/client is connecting to this server)
    this.io.on('connection', socket => {
      //On a new event, check to see if it has already happened, if it has return (throw away that event)
      socket.on('event', (hash, info) => {
        if (!!this.processedHashes[hash]) return;
        this.processedHashes[hash] = Date.now();
        //Push the event to the rx pipeline
        this.events.next(new Event(hash, info, socket));
      });
    });

    //Every hour clear all old hashes
    setInterval(() => {
      this.clearHashes();
    }, 1000 * 60 * 60);

    //Init the event listener (which will handle all transactions/new user auth etc)
    this.startEventListener();
  }

  /**
   * @description startEventListener is the main wrapper for all events
   * any logic that has to do with processing an event coming from another server should go here
   */
  startEventListener() {
    /**
     * @description If startEventListener is for some reason called a second time,
     *  remove the old listener to avoid duplicate run events
     */
    if (!!this.eventListener) {
      this.eventListener.unsubscribe();
    }
    this.eventListener = this.events
      .pipe(filter(x => !!x))
      .subscribe(mEvent => {
        const { hash, event, socket } = mEvent;
        if (typeof event === 'string') return;
        if (event.name === 'getConnectedServers') {
          const handshake = (socket as SocketIO.Socket).handshake;
          const address = `ws://${handshake.address}:${event.data.port}`;

          // in the future determine if the person connection contains the correct authortity to get all servers
          this.emit(socket, {
            name: 'connectedServers',
            data: { servers: Object.keys(this.connectedServers) }
          });
        } else if (event.name === 'connectedServers') {
          console.log(hash, event.data);
        }
      });
  }

  /**
   * @description loops through the map of processedHashes every hour and removes all old hashes to clean up memory
   */
  clearHashes() {
    Object.keys(this.processedHashes).forEach(key => {
      const date = this.processedHashes[key];
      if (Date.now() - 1000 * 60 * 60 > date) {
        delete this.processedHashes[key];
      }
    });
  }

  /**
   * @description wait until the server is online, once it is, then continue with script
   */
  async waitUntilOnline(): Promise<boolean> {
    if (this.online) {
      return this.online;
    }
    await sleep(1000);
    return this.waitUntilOnline();
  }

  /**
   * @description connect to a server using a websocket
   */
  connectTo(ip: string) {
    const socket = ClientIo(ip);
    socket.on('connect', () => (this.connectedServers[socket] = socket));
    socket.on('event', (...args: any[]) =>
      this.events.next(new Event(args[0], args[1], socket))
    );
    socket.on('disconnect', () => delete this.connectedServers[ip]);

    //This is a connect event
    this.emit(socket, {
      name: 'getConnectedServers',
      data: { port: this.port }
    });
  }

  /**
   * @description emit a websocket event to another server and generate a hex string
   * (just wraps the socket emiter so I dont have to code the randomHex generator in every time)
   */
  emit(socket: SocketIOClient.Socket | SocketIO.Socket, data: IEvent['event']) {
    socket.emit('event', crypto.randomBytes(20).toString('hex'), data);
  }
}
