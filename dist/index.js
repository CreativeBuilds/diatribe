"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Server_1 = require("./server/Server");
var sleep_1 = require("./helpers/sleep");
var debug_1 = require("./debug/debug");
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var servers, server, server2, server3, server4, server5, server6, server7, server8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                servers = [];
                server = new Server_1.Server(7676, 'password1');
                server2 = new Server_1.Server(7677, 'password2');
                servers.push(server);
                servers.push(server2);
                return [4, server.waitUntilOnline()];
            case 1:
                _a.sent();
                return [4, server2.waitUntilOnline()];
            case 2:
                _a.sent();
                server.connectTo('[::ffff:127.0.0.1]:7677');
                server3 = new Server_1.Server(7878, 'password3');
                server4 = new Server_1.Server(7879, 'password4');
                server5 = new Server_1.Server(7880, 'password5');
                server6 = new Server_1.Server(7881, 'password6');
                server7 = new Server_1.Server(7882, 'password7');
                server8 = new Server_1.Server(7883, 'password8');
                servers.push(server2);
                servers.push(server3);
                servers.push(server4);
                servers.push(server5);
                servers.push(server6);
                servers.push(server7);
                servers.push(server8);
                return [4, server3.waitUntilOnline()];
            case 3:
                _a.sent();
                return [4, server4.waitUntilOnline()];
            case 4:
                _a.sent();
                return [4, server5.waitUntilOnline()];
            case 5:
                _a.sent();
                return [4, server6.waitUntilOnline()];
            case 6:
                _a.sent();
                return [4, server7.waitUntilOnline()];
            case 7:
                _a.sent();
                return [4, server8.waitUntilOnline()];
            case 8:
                _a.sent();
                server3.connectTo('[::ffff:127.0.0.1]:7676');
                server4.connectTo('[::ffff:127.0.0.1]:7676');
                server5.connectTo('[::ffff:127.0.0.1]:7676');
                server6.connectTo('[::ffff:127.0.0.1]:7676');
                server7.connectTo('[::ffff:127.0.0.1]:7676');
                server8.connectTo('[::ffff:127.0.0.1]:7676');
                return [4, sleep_1.sleep(3000)];
            case 9:
                _a.sent();
                debug_1.debug('Should be finished');
                return [4, sleep_1.sleep(1000)];
            case 10:
                _a.sent();
                servers.forEach(function (server) {
                    var outKeys = Object.keys(server.outboundServers);
                    debug_1.debug("----------- " + server.publicID + " -----------");
                    outKeys.reduce(function (acc, key) {
                        debug_1.debug(server.publicID + ": " + server.outboundServers[key].ip);
                        return acc;
                    }, '');
                });
                return [2];
        }
    });
}); })();
//# sourceMappingURL=index.js.map