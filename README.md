# diatribe

A p-2-p private websocket communication layer that allows for decentralized websocket communication

### More in-depth description

Using NodeJS, Diatribe spins up a Server (also refrenced as a node) and takes a Port to run on, and a password.

The password is a unique string of any length that is used to generate a hash/id for your server and will be recognized by the other nodes.

The server awaits till waitUntilOnline fires, then connects to a server using `server.connectTo('[IPV6 IP HERE]:PORT')` format.

It goes through a verification protocol in which the client (the node which initiated the connection) sends a message, publickey, and publicid to the server (the node which is being connected to) the server will sign the message with the public key using its private key, send that signed cipher back to the client along with the servers own message, publickey, and id. The client then checks the cipher, if it passes the test, then it encrypts the servers message with the servers publickey and signs it with the client privkey and sends it back to the server. The server also checks to make sure it was signed/encrypted properly with the right message if everything checks out both the server and the client consider the connection a "pass" and trust each other.

(The above only allows for one way communication the way the event system works so the process is repeated back to the client)

If the server has more than 5 outbound connections it will tell the 5th connection that it needs to connect to a new server, sends the ip/port to it. Server 5 recieves this and initiates a startConnection with the orginial client. That way each server should be connected to atleast 2 other servers allowing for data checking.

### Notes

In its current state, the system stated above is not entirely finished and has no actual use of sending messages/events. The short term goal is to be able to send websocket messages from one client to all the nodes in the network. This could allow for something like a chat app with no central server or, a mesh network of servers that all have their own chat.

### Getting Started

1. Download repo to local folder
2. run `npm i`
3. run `node ./dist/index.js`

compile the app with tsc (must have tsc install globally)
then run `tsc --watch` (or without watch if you just want to do it once) to compile to the dist folder
