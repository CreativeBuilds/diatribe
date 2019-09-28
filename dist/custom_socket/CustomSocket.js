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
var events_1 = require("events");
var crypto_1 = __importDefault(require("crypto"));
var cryptico_1 = __importDefault(require("cryptico"));
var debug_1 = require("../debug/debug");
var CustomSocket = (function (_super) {
    __extends(CustomSocket, _super);
    function CustomSocket(socket, id, key, RSAKey) {
        var _this = _super.call(this) || this;
        _this.socket = socket;
        _this.events = new rxjs_1.BehaviorSubject(null);
        _this.verified = false;
        _this.key = key;
        _this.id = id;
        _this.RSAKey = RSAKey;
        _this.verificationStatus = 0;
        _this.verificationString = __spreadArrays(Array(10)).map(function () { return (~~(Math.random() * 36)).toString(36); })
            .join('');
        _this.ip = socket.handshake.address;
        var disconnectTimeout = setTimeout(function () {
            if (_this.verificationStatus !== 1)
                return _this.destroy('Server failed to connect');
        }, 10 * 1000);
        _this.on('verificationStatusChanged', function (num) {
            if (num === 1) {
                clearTimeout(disconnectTimeout);
            }
        });
        _this.socket.on('event', function (hash, info) {
            if (info.name === 'init') {
                if (_this.verified === true) {
                    _this.destroy();
                }
                var name_1 = info.name, data = info.data;
                var string = data.string, key_1 = data.key, id_1 = data.id, port = data.port;
                if (!port) {
                    _this.destroy('no port');
                }
                _this.port = port;
                _this.nodeId = id_1;
                _this.nodeKey = key_1;
                var encryptionResult = cryptico_1["default"].encrypt(string, key_1, _this.RSAKey);
                _this.socket.emit('event', crypto_1["default"].randomBytes(20).toString('hex'), {
                    name: 'initResponse',
                    data: {
                        response: encryptionResult,
                        id: _this.id,
                        key: _this.key,
                        message: _this.verificationString
                    }
                });
            }
            else if (info.name === 'initResponse') {
                var name_2 = info.name, data = info.data;
                var response = data.response;
                if (!response) {
                    return _this.destroy('Failed to responsd with response');
                }
                var cryptoRes = cryptico_1["default"].decrypt(response.cipher, _this.RSAKey);
                if (cryptoRes.status !== 'success') {
                    return _this.destroy('Client failed to encrypt with our public key');
                }
                if (cryptoRes.signature !== 'verified') {
                    return _this.destroy('Client failed to sign their encrypted message');
                }
                if (cryptoRes.plaintext !== _this.verificationString) {
                    return _this.destroy('Client failed to send us the message we were looking for.');
                }
                _this.initData = {
                    response: response,
                    id: _this.nodeId,
                    key: _this.nodeKey
                };
                _this.initCryptoRes = cryptoRes;
                _this.emit('verifiedNode', { data: data, cryptoRes: cryptoRes });
                _this.verificationStatus = 1;
                _this.emit('verificationStatusChange', _this.verificationStatus);
                var msg = crypto_1["default"].randomBytes(20).toString('hex');
                _this.socket.emit('event', crypto_1["default"].randomBytes(20).toString('hex'), {
                    name: 'initComplete',
                    data: {
                        message: msg,
                        encryption: cryptico_1["default"].encrypt(msg, _this.nodeKey, _this.RSAKey)
                    }
                });
            }
            else if (info.name === 'newMeshClient') {
                _this.emit('newMeshClient', info.data.ip || null);
            }
        });
        return _this;
    }
    CustomSocket.prototype.destroy = function (reason) {
        if (reason === void 0) { reason = ''; }
        debug_1.debug("Destroy (server): " + reason, 'error');
        this.emit('destroy', reason);
        try {
            this.socket.disconnect();
        }
        catch (err) {
            console.error(err);
        }
    };
    CustomSocket.prototype.verifyOrFail = function () {
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
                        _this.on('verifiedNode', function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i] = arguments[_i];
                            }
                            res.apply(void 0, args);
                        });
                    })
                        .then(function (data) { return [null, data]; })["catch"](function (err) {
                        _this.destroy();
                        return [err];
                    })];
            });
        });
    };
    return CustomSocket;
}(events_1.EventEmitter));
exports.CustomSocket = CustomSocket;
//# sourceMappingURL=CustomSocket.js.map