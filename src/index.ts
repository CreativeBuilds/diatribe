import { Server } from './server/Server';
import { sleep } from './helpers/sleep';
import { debug } from './debug/debug';

(async () => {
  const servers: Server[] = [];

  const server = new Server(7676, 'password1');
  const server2 = new Server(7677, 'password2');

  servers.push(server);
  servers.push(server2);

  await server.waitUntilOnline();
  await server2.waitUntilOnline();

  server.connectTo('[::ffff:127.0.0.1]:7677');

  const server3 = new Server(7878, 'password3');
  const server4 = new Server(7879, 'password4');
  const server5 = new Server(7880, 'password5');
  const server6 = new Server(7881, 'password6');
  const server7 = new Server(7882, 'password7');
  const server8 = new Server(7883, 'password8');

  servers.push(server2);
  servers.push(server3);
  servers.push(server4);
  servers.push(server5);
  servers.push(server6);
  servers.push(server7);
  servers.push(server8);

  await server3.waitUntilOnline();
  await server4.waitUntilOnline();
  await server5.waitUntilOnline();
  await server6.waitUntilOnline();
  await server7.waitUntilOnline();
  await server8.waitUntilOnline();

  server3.connectTo('[::ffff:127.0.0.1]:7676');
  server4.connectTo('[::ffff:127.0.0.1]:7676');
  server5.connectTo('[::ffff:127.0.0.1]:7676');
  server6.connectTo('[::ffff:127.0.0.1]:7676');
  server7.connectTo('[::ffff:127.0.0.1]:7676');
  server8.connectTo('[::ffff:127.0.0.1]:7676');

  await sleep(3000);

  debug('Should be finished');

  await sleep(1000);
  servers.forEach(server => {
    const outKeys = Object.keys(server.outboundServers);
    debug(`----------- ${server.publicID} -----------`);
    outKeys.reduce((acc, key) => {
      debug(`${server.publicID}: ${server.outboundServers[key].ip}`);
      return acc;
    }, '');
  });
})();
