"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var rxjs_1 = require("rxjs");
var socket_io_client_1 = __importDefault(require("socket.io-client"));
var events_1 = require("events");
var Event_1 = require("../event/Event");
var crypto_1 = __importDefault(require("crypto"));
var cryptico_1 = __importDefault(require("cryptico"));
var debug_1 = require("../debug/debug");
var CustomClientSocket = (function (_super) {
    __extends(CustomClientSocket, _super);
    function CustomClientSocket(ip, key, id, RSAKey, port) {
        var _this = _super.call(this) || this;
        _this.ip = ip;
        _this.key = key;
        _this.id = id;
        _this.selfPort = port;
        _this.RSAKey = RSAKey;
        _this.socket = socket_io_client_1["default"]("ws://" + ip + "/");
        _this.events = new rxjs_1.BehaviorSubject(null);
        _this.verificationStatus = 0;
        _this.verificationString = __spreadArrays(Array(10)).map(function () { return (~~(Math.random() * 36)).toString(36); })
            .join('');
        var disconnectTimeout = setTimeout(function () {
            if (_this.verificationStatus !== 1)
                return _this.destroy('Server failed to connect');
        }, 10 * 1000);
        _this.on('verificationStatusChanged', function (num) {
            if (num === 1) {
                clearTimeout(disconnectTimeout);
            }
        });
        _this.socket.on('event', function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var hash = args[0], info = args[1];
            _this.emit.apply(_this, __spreadArrays(['event'], args));
            var name = info.name, data = info.data;
            if (name === 'initResponse') {
                var response = data.response;
                var id_1 = data.id;
                var publicKey = data.key;
                _this.nodeKey = publicKey;
                _this.nodeId = id_1;
                if (!response || !id_1 || !publicKey) {
                    return _this.destroy('Failed to response with response, id, or publicKey');
                }
                var cryptoRes = cryptico_1["default"].decrypt(response.cipher, _this.RSAKey);
                if (cryptoRes.status !== 'success') {
                    return _this.destroy('Server failed to encrypt with our public key');
                }
                if (cryptoRes.signature !== 'verified') {
                    return _this.destroy('Server failed to sign their encrypted message');
                }
                if (cryptoRes.plaintext !== _this.verificationString) {
                    return _this.destroy('Server failed to send us the message we were looking for.');
                }
                _this.initData = data;
                _this.initCryptoRes = cryptoRes;
                var encryptionResult = cryptico_1["default"].encrypt(data.message, _this.nodeKey, _this.RSAKey);
                _this.socket.emit('event', crypto_1["default"].randomBytes(20).toString('hex'), {
                    data: { response: encryptionResult },
                    name: 'initResponse'
                });
            }
            else if (name === 'initComplete') {
                var cryptoRes = cryptico_1["default"].decrypt(data.encryption.cipher, _this.RSAKey);
                if (cryptoRes.status !== 'success') {
                    return _this.destroy('Server failed to encrypt with our public key on complete');
                }
                if (cryptoRes.signature !== 'verified') {
                    return _this.destroy('Server failed to sign their encrypted message on complete');
                }
                if (cryptoRes.plaintext !== data.message) {
                    return _this.destroy('Server failed to send us the message we were looking for on complete.');
                }
                debug_1.debug("Completed connection with other node! (from client)");
                _this.emit('verifiedNode', { data: data, cryptoRes: cryptoRes });
                _this.verificationStatus = 1;
                _this.emit('verificationStatusChange', _this.verificationStatus);
            }
            _this.events.next(new Event_1.Event(args[0], args[1], _this.socket));
        });
        _this.socket.emit('event', crypto_1["default"].randomBytes(20).toString('hex'), {
            name: 'init',
            data: {
                string: _this.verificationString,
                key: _this.key,
                id: _this.id,
                port: _this.selfPort
            }
        });
        _this.socket.on('disconnect', function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.emit.apply(_this, __spreadArrays(['disconnect'], args));
        });
        _this.socket.on('connect', function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.emit.apply(_this, __spreadArrays(['connect'], args));
        });
        return _this;
    }
    CustomClientSocket.prototype.newClient = function (ip) {
        if (!ip)
            return this.destroy('New Client Was Fired');
        this.socket.emit('event', crypto_1["default"].randomBytes(20).toString('hex'), {
            name: 'newMeshClient',
            data: {
                ip: ip
            }
        });
        this.destroy('New client was fired, and emited meshClient');
    };
    CustomClientSocket.prototype.destroy = function (reason) {
        if (reason === void 0) { reason = ''; }
        debug_1.debug("Destroy (client): " + reason, 'error');
        this.verificationStatus = 2;
        this.emit('verificationStatusChange', this.verificationStatus);
        this.emit('destroy', reason);
        try {
            this.socket.disconnect();
        }
        catch (err) {
            console.error(err);
        }
    };
    CustomClientSocket.prototype.verifyOrFail = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (res, rej) {
                        _this.on('verificationStatusChange', function (num) {
                            if (num === 1) {
                                res({ data: _this.initData, cryptoRes: _this.initCryptoRes });
                            }
                            else {
                                rej('Verification Failed');
                            }
                        });
                        _this.on('verifiedNode', res);
                    })
                        .then(function (data) { return [null, data]; })["catch"](function (err) {
                        _this.destroy();
                        return [err];
                    })];
            });
        });
    };
    return CustomClientSocket;
}(events_1.EventEmitter));
exports.CustomClientSocket = CustomClientSocket;
//# sourceMappingURL=CustomClientSocket.js.map