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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var socket_io_1 = __importDefault(require("socket.io"));
var http_1 = __importDefault(require("http"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var Event_1 = require("../event/Event");
var crypto_1 = __importDefault(require("crypto"));
var sleep_1 = require("../helpers/sleep");
var cryptico_1 = __importDefault(require("cryptico"));
var CustomSocket_1 = require("../custom_socket/CustomSocket");
var CustomClientSocket_1 = require("../custom_socket/CustomClientSocket");
var debug_1 = require("../debug/debug");
var Server = (function () {
    function Server(port, passPhrase) {
        var _this = this;
        this.app = express_1["default"]();
        this.port = port;
        this.http = http_1["default"].createServer(this.app);
        this.io = socket_io_1["default"](this.http);
        this.processedHashes = {};
        this.outboundServers = {};
        this.inboundServers = {};
        this.RSAKey = cryptico_1["default"].generateRSAKey(passPhrase, 1024);
        this.publicKey = cryptico_1["default"].publicKeyString(this.RSAKey);
        this.publicID = cryptico_1["default"].publicKeyID(this.publicKey);
        this.events = new rxjs_1.BehaviorSubject(null);
        this.http.listen(port, function () {
            var address = _this.http.address();
            _this.online = true;
            _this.debug("Listening on port " + address.port);
        });
        this.io.on('connection', function (socket) { return __awaiter(_this, void 0, void 0, function () {
            var address, newCustomSocket, _a, error, info;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.debug(this.publicID + " | Connected clients " + this.io.clients.length);
                        address = socket.handshake.address;
                        newCustomSocket = new CustomSocket_1.CustomSocket(socket, this.publicID, this.publicKey, this.RSAKey);
                        return [4, newCustomSocket.verifyOrFail()];
                    case 1:
                        _a = _b.sent(), error = _a[0], info = _a[1];
                        if (error) {
                            socket.disconnect();
                            return [2, this.debug(error.message, 'error')];
                        }
                        this.debug('passed newCustomSocket, connecting back to client');
                        this.fullIp = "[" + newCustomSocket.ip + "]:" + newCustomSocket.port;
                        if (!this.alreadyConnected(this.fullIp)) {
                            this.connectTo(this.fullIp);
                        }
                        newCustomSocket.on('newMeshClient', function (ip) {
                            if (!ip)
                                return;
                            _this.debug('newMeshClient received!');
                            var outboundKeys = Object.keys(_this.outboundServers);
                            if (outboundKeys.length >= 5) {
                                if (!!_this.outboundServers[newCustomSocket.nodeId]) {
                                    _this.debug("Breaking outbound connection with " + newCustomSocket.nodeId + " (from server)");
                                    _this.outboundServers[newCustomSocket.nodeId].destroy();
                                    delete _this.outboundServers[newCustomSocket.nodeId];
                                }
                                if (!!_this.inboundServers[newCustomSocket.nodeId]) {
                                    _this.debug("Breaking inbound with " + newCustomSocket.nodeId + " (from server)");
                                    delete _this.inboundServers[newCustomSocket.nodeId];
                                }
                                newCustomSocket.destroy();
                            }
                            _this.connectTo(ip);
                        });
                        newCustomSocket.socket.on('disconnect', function () {
                            newCustomSocket.destroy();
                        });
                        newCustomSocket.on('event', function (hash, info) {
                            if (!!_this.processedHashes[hash])
                                return;
                            _this.processedHashes[hash] = Date.now();
                            _this.events.next(new Event_1.Event(hash, info, socket));
                        });
                        this.inboundServers[newCustomSocket.nodeId];
                        return [2];
                }
            });
        }); });
        setInterval(function () {
            _this.clearHashes();
        }, 1000 * 60 * 60);
        this.startEventListener();
        this.debug('Server Started!');
    }
    Server.prototype.debug = function (var1, var2) {
        if (this.port !== 7676)
            return;
        debug_1.debug(var1, var2 || 'log');
    };
    Server.prototype.alreadyConnected = function (ip) {
        var _this = this;
        return (Object.keys(this.outboundServers).reduce(function (acc, key) {
            if (_this.outboundServers[key].ip === ip) {
                _this.debug('IPS MATCH ' + ip);
                acc.push(ip);
            }
            return acc;
        }, []).length > 0);
    };
    Server.prototype.connectTo = function (ip) {
        return __awaiter(this, void 0, void 0, function () {
            var customClientSocket, _a, failed, info, outboundKeys;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.debug("CONNECTING TO " + ip);
                        customClientSocket = new CustomClientSocket_1.CustomClientSocket(ip, this.publicKey, this.publicID, this.RSAKey, this.port);
                        return [4, customClientSocket.verifyOrFail()];
                    case 1:
                        _a = _b.sent(), failed = _a[0], info = _a[1];
                        if (!!failed)
                            return [2, console.error(failed)];
                        outboundKeys = Object.keys(this.outboundServers);
                        this.debug("Outbound keys " + outboundKeys.length);
                        if (outboundKeys.length >= 5) {
                            this.outboundServers[outboundKeys[4]].newClient(ip);
                        }
                        this.outboundServers[customClientSocket.nodeId] = customClientSocket;
                        this.debug("Connected to " + ip);
                        customClientSocket.on('event', function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i] = arguments[_i];
                            }
                            _this.events.next(new Event_1.Event(args[0], args[1], customClientSocket.socket));
                        });
                        customClientSocket.on('disconnect', function () { return delete _this.outboundServers[customClientSocket.socket.id]; });
                        return [2];
                }
            });
        });
    };
    Server.prototype.startEventListener = function () {
        if (!!this.eventListener) {
            this.eventListener.unsubscribe();
        }
        this.eventListener = this.events
            .pipe(operators_1.filter(function (x) { return !!x; }))
            .subscribe(function (mEvent) {
            var hash = mEvent.hash, event = mEvent.event, socket = mEvent.socket;
            var confirmString = __spreadArrays(Array(10)).map(function (i) { return (~~(Math.random() * 36)).toString(36); })
                .join('');
            if (typeof event === 'string')
                return;
        });
    };
    Server.prototype.verifyNode = function () {
        return true;
    };
    Server.prototype.clearHashes = function () {
        var _this = this;
        Object.keys(this.processedHashes).forEach(function (key) {
            var date = _this.processedHashes[key];
            if (Date.now() - 1000 * 60 * 60 > date) {
                delete _this.processedHashes[key];
            }
        });
    };
    Server.prototype.waitUntilOnline = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.online) {
                            return [2, this.online];
                        }
                        return [4, sleep_1.sleep(1000)];
                    case 1:
                        _a.sent();
                        return [2, this.waitUntilOnline()];
                }
            });
        });
    };
    Server.prototype.emitToOne = function (socket, data) {
        socket.emit('event', crypto_1["default"].randomBytes(20).toString('hex'), data);
    };
    Server.prototype.emitToAll = function (data, hash) {
        if (hash === void 0) { hash = crypto_1["default"].randomBytes(20).toString('hex'); }
        this.processedHashes[hash] = Date.now();
        this.io.emit('event', hash, data);
    };
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=Server.js.map