"use strict";
exports.__esModule = true;
exports.isIPv6 = function (ip) {
    return /^((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4}))*::((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4}))*|((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4})){7}$/g.test(ip.split(/((?::))(?:[0-9]+)$/gm)[0]);
};
//# sourceMappingURL=isIpv6.js.map