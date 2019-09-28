"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var moment_1 = __importDefault(require("moment"));
var chalk_1 = __importDefault(require("chalk"));
var debugDisabled = false;
exports.debug = function (text, type) {
    if (type === void 0) { type = 'log'; }
    if (debugDisabled)
        return;
    var date = moment_1["default"]().format() + ":";
    var log2 = chalk_1["default"].bold(date) + " " + text;
    if (type === 'log') {
        console.log(chalk_1["default"].white("" + log2));
    }
    else if (type === 'warn') {
        console.log(chalk_1["default"].yellow("" + log2));
    }
    else if (type === 'error') {
        console.log(chalk_1["default"].red("" + log2));
    }
};
//# sourceMappingURL=debug.js.map