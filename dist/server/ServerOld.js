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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var socket_io_1 = __importDefault(require("socket.io"));
var http_1 = __importDefault(require("http"));
var socket_io_client_1 = __importDefault(require("socket.io-client"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var Event_1 = require("../event/Event");
var crypto_1 = __importDefault(require("crypto"));
var Server = (function () {
    function Server(port) {
        var _this = this;
        this.app = express_1["default"]();
        this.http = http_1["default"].createServer(this.app);
        this.io = socket_io_1["default"](this.http);
        this.processedHashes = {};
        this.connectedServers = {};
        this.events = new rxjs_1.BehaviorSubject(null);
        this.port = port;
        this.http.listen(port, function () {
            var address = _this.http.address();
            _this.online = true;
            console.log("listening on *:" + address.port);
        });
        this.io.on('connection', function (socket) {
            socket.on('event', function (hash, info) {
                if (!!_this.processedHashes[hash])
                    return;
                _this.processedHashes[hash] = Date.now();
                _this.events.next(new Event_1.Event(hash, info, socket));
            });
        });
        setInterval(function () {
            _this.clearHashes();
        }, 1000 * 60 * 60);
        this.startEventListener();
    }
    Server.prototype.startEventListener = function () {
        var _this = this;
        if (!!this.eventListener) {
            this.eventListener.unsubscribe();
        }
        this.eventListener = this.events
            .pipe(operators_1.filter(function (x) { return !!x; }))
            .subscribe(function (mEvent) {
            var hash = mEvent.hash, event = mEvent.event, socket = mEvent.socket;
            if (typeof event === 'string')
                return;
            if (event.name === 'getConnectedServers') {
                var handshake = socket.handshake;
                var address = "ws://" + handshake.address + ":" + event.data.port;
                _this.emit(socket, {
                    name: 'connectedServers',
                    data: { servers: Object.keys(_this.connectedServers) }
                });
            }
            else if (event.name === 'connectedServers') {
                console.log(hash, event.data);
            }
        });
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
                        return [4, sleep(1000)];
                    case 1:
                        _a.sent();
                        return [2, this.waitUntilOnline()];
                }
            });
        });
    };
    Server.prototype.connectTo = function (ip) {
        var _this = this;
        var socket = socket_io_client_1["default"](ip);
        socket.on('connect', function () { return (_this.connectedServers[socket] = socket); });
        socket.on('event', function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return _this.events.next(new Event_1.Event(args[0], args[1], socket));
        });
        socket.on('disconnect', function () { return delete _this.connectedServers[ip]; });
        this.emit(socket, {
            name: 'getConnectedServers',
            data: { port: this.port }
        });
    };
    Server.prototype.emit = function (socket, data) {
        socket.emit('event', crypto_1["default"].randomBytes(20).toString('hex'), data);
    };
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=ServerOld.js.map