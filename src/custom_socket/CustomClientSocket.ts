import { BehaviorSubject } from 'rxjs';
import ClientIo from 'socket.io-client';
import { EventEmitter } from 'events';
import { Event } from '../event/Event';
import { filter } from 'rxjs/operators';
import crypto from 'crypto';
import cryptico from 'cryptico';
import { debug } from '../debug/debug';

/**
 * @description custom socket that the node uses when it connects to another node
 */
export class CustomClientSocket extends EventEmitter {
  ip: string;
  key: string;
  id: string;
  RSAKey: string;
  socket: SocketIOClient.Socket;
  events: BehaviorSubject<Event>;
  verificationString: string;
  //0 is working 1 is good to go 2 is failed
  verificationStatus: number;
  initData?: any;
  initCryptoRes?: any;
  nodeKey?: string;
  nodeId?: string;
  selfPort: number;

  constructor(
    ip: string,
    key: string,
    id: string,
    RSAKey: string,
    port: number
  ) {
    super();
    this.ip = ip;
    this.key = key;
    this.id = id;
    this.selfPort = port;
    this.RSAKey = RSAKey;
    this.socket = ClientIo(`ws://${ip}/`);
    this.events = new BehaviorSubject(null);
    this.verificationStatus = 0;
    this.verificationString = [...Array(10)]
      .map(() => (~~(Math.random() * 36)).toString(36))
      .join('');

    const disconnectTimeout = setTimeout(() => {
      if (this.verificationStatus !== 1)
        return this.destroy('Server failed to connect');
    }, 10 * 1000);

    this.on('verificationStatusChanged', num => {
      if (num === 1) {
        clearTimeout(disconnectTimeout);
      }
    });

    this.socket.on('event', (...args: any[]) => {
      const [hash, info] = args;
      this.emit('event', ...args);

      const { name, data }: { name: string; data: any } = info;

      if (name === 'initResponse') {
        // console.log('SERVER RESPONDED');
        const response: { status: string; cipher: string } = data.response;
        const id: string = data.id;
        const publicKey: string = data.key;
        this.nodeKey = publicKey;
        this.nodeId = id;
        if (!response || !id || !publicKey) {
          // console.log(data, !response, !id, !publicKey);
          return this.destroy(
            'Failed to response with response, id, or publicKey'
          );
        }
        // console.log('response', response, this.RSAKey);
        const cryptoRes = cryptico.decrypt(response.cipher, this.RSAKey);
        if (cryptoRes.status !== 'success') {
          return this.destroy('Server failed to encrypt with our public key');
        }
        if (cryptoRes.signature !== 'verified') {
          return this.destroy('Server failed to sign their encrypted message');
        }
        // If gotten to this point the server has successfully encrypted A message with this node's public key, signed it and sent it to us to decrypt
        // console.log(
        //   'PLAINTEXT',
        //   cryptoRes.plaintext,
        //   'verifyString',
        //   this.verificationString
        // );
        if (cryptoRes.plaintext !== this.verificationString) {
          return this.destroy(
            'Server failed to send us the message we were looking for.'
          );
        }
        /**
         * @TODO May have to include a way to check that the other node has verified but this should be fine?
         */
        this.initData = data;
        this.initCryptoRes = cryptoRes;
        const encryptionResult = cryptico.encrypt(
          data.message,
          this.nodeKey,
          this.RSAKey
        );
        this.socket.emit('event', crypto.randomBytes(20).toString('hex'), {
          data: { response: encryptionResult },
          name: 'initResponse'
        });
      } else if (name === 'initComplete') {
        const cryptoRes = cryptico.decrypt(data.encryption.cipher, this.RSAKey);
        if (cryptoRes.status !== 'success') {
          return this.destroy(
            'Server failed to encrypt with our public key on complete'
          );
        }
        if (cryptoRes.signature !== 'verified') {
          return this.destroy(
            'Server failed to sign their encrypted message on complete'
          );
        }
        if (cryptoRes.plaintext !== data.message) {
          return this.destroy(
            'Server failed to send us the message we were looking for on complete.'
          );
        }
        debug(`Completed connection with other node! (from client)`);
        this.emit('verifiedNode', { data, cryptoRes });
        this.verificationStatus = 1;
        this.emit('verificationStatusChange', this.verificationStatus);
      }

      this.events.next(new Event(args[0], args[1], this.socket));
    });

    this.socket.emit('event', crypto.randomBytes(20).toString('hex'), {
      name: 'init',
      data: {
        string: this.verificationString,
        key: this.key,
        id: this.id,
        port: this.selfPort
      }
    });

    this.socket.on('disconnect', (...args: any[]) => {
      // console.log('disconnected from server');
      this.emit('disconnect', ...args);
    });
    this.socket.on('connect', (...args: any[]) => {
      this.emit('connect', ...args);
    });
  }

  newClient(ip: string) {
    if (!ip) return this.destroy('New Client Was Fired');
    this.socket.emit('event', crypto.randomBytes(20).toString('hex'), {
      name: 'newMeshClient',
      data: {
        ip
      }
    });
    this.destroy('New client was fired, and emited meshClient');
  }

  destroy(reason = '') {
    debug(`Destroy (client): ${reason}`, 'error');
    this.verificationStatus = 2;
    this.emit('verificationStatusChange', this.verificationStatus);
    this.emit('destroy', reason);
    try {
      this.socket.disconnect();
    } catch (err) {
      console.error(err);
    }
  }

  async verifyOrFail(): Promise<any[]> {
    return new Promise((res, rej) => {
      //Send event to the server to start the initiation protocol (step 1 of 3)
      this.on('verificationStatusChange', num => {
        if (num === 1) {
          res({ data: this.initData, cryptoRes: this.initCryptoRes });
        } else {
          // console.log('num', num);
          rej('Verification Failed');
        }
      });
      this.on('verifiedNode', res);
    })
      .then(data => [null, data])
      .catch(err => {
        this.destroy();
        return [err];
      });
  }
}
