'use strict';

/**
 * Extends the rapport router response object.
 *
 * @param {object} wrappedSocket The wrapped socket to add functionality to.
 */
const extendCreateRouterResponderObject = (wrappedSocket) => {
    const previousCreateRouterResponderObject = wrappedSocket._functions.onMessage.createRouterResponderObject;

    if (previousCreateRouterResponderObject) {
        wrappedSocket._functions.onMessage.createRouterResponderObject = (wrappedSocket, requestId) => {
            const res = previousCreateRouterResponderObject(wrappedSocket, requestId);

            if (requestId) {
                res.sendProgressUpdate = (message) => {
                    wrappedSocket.sendProgressUpdate(requestId, message);
                };
            } else {
                res.sendProgressUpdate = () => {
                    return res;
                };
            }

            return res;
        };
    }
};

/**
 * Adds onMessage functionality to a rapport websocket.
 *
 * @param {object} wrappedSocket The websocket to extend.
 */
module.exports = (wrappedSocket) => {
    extendCreateRouterResponderObject(wrappedSocket);
};
