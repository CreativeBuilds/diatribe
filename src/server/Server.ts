import express from 'express';
import SocketIO from 'socket.io';
import HTTP from 'http';
import { AddressInfo } from 'net';
import ClientIo from 'socket.io-client';
import rxjs, { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Event } from '../event/Event';
import crypto from 'crypto';
import { IEvent } from '../types';
import { isIPv6 } from '../helpers/isIpv6';
import { sleep } from '../helpers/sleep';
import cryptico from 'cryptico';
import { CustomSocket } from '../custom_socket/CustomSocket';
import { CustomClientSocket } from '../custom_socket/CustomClientSocket';
import { debug } from '../debug/debug';

declare global {
  interface console {
    print: () => {};
  }
}

/**
 *@param port {number} the port you want to start your node on (WILL BE FORCED IN ACTUAL RUNTIME)
 *@param initialConnection {string} ipv6 ip that you want to connect to
 * @export
 * @class Server
 */
export class Server {
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
  //all outbound connections in ipv6 format that return the ms timestamp they were created
  outboundServers: { [ipv6: string]: CustomClientSocket };
  //all inbound connections in ipv6 format that return the ms timestamp they were created
  inboundServers: { [ipv6: string]: CustomSocket };
  eventListener: rxjs.Subscription;

  RSAKey: any;
  publicKey: string;
  publicID: string;
  fullIp: string;

  constructor(port: number, passPhrase: string) {
    this.port = port;
    //Create the HTTP Server locally
    this.http = HTTP.createServer(this.app);
    //assign the websocket to the same port as the http server
    this.io = SocketIO(this.http);
    //Start up the hashes map
    this.processedHashes = {};
    //Start up the outbound servers map
    this.outboundServers = {};
    //Start up the inbound servers map
    this.inboundServers = {};

    this.RSAKey = cryptico.generateRSAKey(passPhrase, 1024);
    this.publicKey = cryptico.publicKeyString(this.RSAKey);
    this.publicID = cryptico.publicKeyID(this.publicKey);

    //Start the pipeline for events
    this.events = new BehaviorSubject(null);

    //Start the http server on a specified port
    this.http.listen(port, () => {
      const address = <AddressInfo>this.http.address();
      this.online = true;
      this.debug(`Listening on port ${address.port}`);
    });

    //On websocket connection (Another server/client is connecting to this server)
    this.io.on('connection', async socket => {
      this.debug(
        `${this.publicID} | Connected clients ${this.io.clients.length}`
      );
      //On a new event, check to see if it has already happened, if it has return (throw away that event)
      const address = socket.handshake.address;
      const newCustomSocket = new CustomSocket(
        socket,
        this.publicID,
        this.publicKey,
        this.RSAKey
      );
      const [error, info] = await newCustomSocket.verifyOrFail();
      if (error) {
        socket.disconnect();
        return this.debug(error.message, 'error');
      }
      this.debug('passed newCustomSocket, connecting back to client');
      this.fullIp = `[${newCustomSocket.ip}]:${newCustomSocket.port}`;
      if (!this.alreadyConnected(this.fullIp)) {
        this.connectTo(this.fullIp);
      }

      newCustomSocket.on('newMeshClient', ip => {
        if (!ip) return;
        this.debug('newMeshClient received!');
        const outboundKeys = Object.keys(this.outboundServers);
        if (outboundKeys.length >= 5) {
          // If we have an outbound connection (listen to this server) remove it;
          if (!!this.outboundServers[newCustomSocket.nodeId]) {
            // Connection exists break connection with this server and init connection with new ip
            this.debug(
              `Breaking outbound connection with ${newCustomSocket.nodeId} (from server)`
            );
            this.outboundServers[newCustomSocket.nodeId].destroy();
            delete this.outboundServers[newCustomSocket.nodeId];
          }
          // If the server listens to us we need to remove as it only sends us newMeshClient when it disconnects from us
          if (!!this.inboundServers[newCustomSocket.nodeId]) {
            this.debug(
              `Breaking inbound with ${newCustomSocket.nodeId} (from server)`
            );
            delete this.inboundServers[newCustomSocket.nodeId];
          }
          newCustomSocket.destroy();
        }
        this.connectTo(ip);
      });
      newCustomSocket.socket.on('disconnect', () => {
        newCustomSocket.destroy();
      });
      newCustomSocket.on('event', (hash, info) => {
        if (!!this.processedHashes[hash]) return;
        this.processedHashes[hash] = Date.now();
        //Push the event to the rx pipeline
        this.events.next(new Event(hash, info, socket));
      });
      this.inboundServers[newCustomSocket.nodeId];
    });

    //Every hour clear all old hashes
    setInterval(() => {
      this.clearHashes();
    }, 1000 * 60 * 60);

    //Init the event listener (which will handle all transactions/new user auth etc)
    this.startEventListener();
    this.debug('Server Started!');
  }

  debug(var1: string, var2?: 'error' | 'log' | 'warn') {
    if (this.port !== 7676) return;
    debug(var1, var2 || 'log');
  }

  alreadyConnected(ip: string) {
    return (
      Object.keys(this.outboundServers).reduce((acc, key) => {
        if (this.outboundServers[key].ip === ip) {
          this.debug('IPS MATCH ' + ip);
          acc.push(ip);
        }
        return acc;
      }, []).length > 0
    );
  }

  async connectTo(ip: string) {
    // console.log('ip', ipv6)
    // if (!isIPv6(ipv6)) {
    //   throw new Error(
    //     'Please provide an IPv6 ip to connect to. If you need to convert an IPv4 you can use this website https://www.ultratools.com/tools/ipv4toipv6Result or impliment your own library to do so.'
    //   );
    // }
    this.debug(`CONNECTING TO ${ip}`);

    const customClientSocket = new CustomClientSocket(
      ip,
      this.publicKey,
      this.publicID,
      this.RSAKey,
      this.port
    );
    const [failed, info] = await customClientSocket.verifyOrFail();
    if (!!failed) return console.error(failed);
    const outboundKeys = Object.keys(this.outboundServers);
    this.debug(`Outbound keys ${outboundKeys.length}`);
    if (outboundKeys.length >= 5) {
      this.outboundServers[outboundKeys[4]].newClient(ip);
    }
    this.outboundServers[customClientSocket.nodeId] = customClientSocket;
    this.debug(`Connected to ${ip}`);
    customClientSocket.on('event', (...args: any[]) => {
      this.events.next(new Event(args[0], args[1], customClientSocket.socket));
    });
    customClientSocket.on(
      'disconnect',
      () => delete this.outboundServers[customClientSocket.socket.id]
    );
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
        const confirmString = [...Array(10)]
          .map(i => (~~(Math.random() * 36)).toString(36))
          .join('');
        if (typeof event === 'string') return;
      });
  }

  /**
   * @description in the future this will verify a node can connect to the network
   */
  verifyNode() {
    return true;
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
   * @description emit a websocket event to another server and generate a hex string
   * (just wraps the socket emiter so I dont have to code the randomHex generator in every time)
   */
  emitToOne(
    socket: SocketIOClient.Socket | SocketIO.Socket,
    data: IEvent['event']
  ) {
    socket.emit('event', crypto.randomBytes(20).toString('hex'), data);
  }
  emitToAll(
    data: IEvent['event'],
    hash = crypto.randomBytes(20).toString('hex')
  ) {
    this.processedHashes[hash] = Date.now();
    this.io.emit('event', hash, data);
  }
}
