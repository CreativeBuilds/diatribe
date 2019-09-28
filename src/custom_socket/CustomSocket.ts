import { BehaviorSubject } from 'rxjs';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import cryptico from 'cryptico';
import { stringify } from 'querystring';
import { debug } from '../debug/debug';

/**
 * @description custom socket that the node uses when a client connects to IT
 */
export class CustomSocket extends EventEmitter {
  socket: SocketIO.Socket;
  events: BehaviorSubject<Event>;
  verified: boolean;
  nodeId: string;
  nodeKey: string;
  id: string;
  ip: string;
  port: string;
  key: string;
  RSAKey: string;
  verificationString: string;
  verificationStatus: number;
  initData?: any;
  initCryptoRes?: any;

  constructor(
    socket: SocketIO.Socket,
    id: string,
    key: string,
    RSAKey: string
  ) {
    super();
    this.socket = socket;
    this.events = new BehaviorSubject(null);
    this.verified = false;
    this.key = key;
    this.id = id;
    this.RSAKey = RSAKey;
    this.verificationStatus = 0;
    this.verificationString = [...Array(10)]
      .map(() => (~~(Math.random() * 36)).toString(36))
      .join('');
    this.ip = socket.handshake.address;

    const disconnectTimeout = setTimeout(() => {
      if (this.verificationStatus !== 1)
        return this.destroy('Server failed to connect');
    }, 10 * 1000);

    this.on('verificationStatusChanged', num => {
      if (num === 1) {
        clearTimeout(disconnectTimeout);
      }
    });

    this.socket.on('event', (hash, info) => {
      // console.log('HASH', hash, 'INFO', info);
      if (info.name === 'init') {
        // Trying to init after already being verified causes the connection to be dropped
        if (this.verified === true) {
          this.destroy();
        }
        const { name, data } = info;
        const { string, key, id, port } = data;
        if (!port) {
          this.destroy('no port');
        }
        this.port = port;
        this.nodeId = id;
        this.nodeKey = key;
        const encryptionResult = cryptico.encrypt(string, key, this.RSAKey);
        this.socket.emit('event', crypto.randomBytes(20).toString('hex'), {
          name: 'initResponse',
          data: {
            response: encryptionResult,
            id: this.id,
            key: this.key,
            message: this.verificationString
          }
        });
      } else if (info.name === 'initResponse') {
        const { name, data }: { name: string; data: any } = info;
        const response: { cipher: string } = data.response;
        if (!response) {
          return this.destroy('Failed to responsd with response');
        }
        const cryptoRes = cryptico.decrypt(response.cipher, this.RSAKey);
        if (cryptoRes.status !== 'success') {
          return this.destroy('Client failed to encrypt with our public key');
        }
        if (cryptoRes.signature !== 'verified') {
          return this.destroy('Client failed to sign their encrypted message');
        }
        if (cryptoRes.plaintext !== this.verificationString) {
          return this.destroy(
            'Client failed to send us the message we were looking for.'
          );
        }
        this.initData = {
          response,
          id: this.nodeId,
          key: this.nodeKey
        };
        this.initCryptoRes = cryptoRes;
        this.emit('verifiedNode', { data, cryptoRes });
        this.verificationStatus = 1;
        this.emit('verificationStatusChange', this.verificationStatus);
        const msg = crypto.randomBytes(20).toString('hex');
        this.socket.emit('event', crypto.randomBytes(20).toString('hex'), {
          name: 'initComplete',
          data: {
            message: msg,
            encryption: cryptico.encrypt(msg, this.nodeKey, this.RSAKey)
          }
        });
      } else if (info.name === 'newMeshClient') {
        this.emit('newMeshClient', info.data.ip || null);
      }
    });
  }
  destroy(reason = '') {
    debug(`Destroy (server): ${reason}`, 'error');
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
      this.on('verifiedNode', (...args: any[]) => {
        res(...args);
      });
    })
      .then(data => [null, data])
      .catch(err => {
        this.destroy();
        return [err];
      });
  }
}
