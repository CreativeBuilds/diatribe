"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var Event = (function () {
    function Event(hash, event, socket) {
        this.hash = hash;
        this.event = event;
        this.socket = socket;
    }
    Event.prototype.reply = function (event) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        (_a = this.socket).emit.apply(_a, __spreadArrays([event], args));
    };
    return Event;
}());
exports.Event = Event;
//# sourceMappingURL=Event.js.map