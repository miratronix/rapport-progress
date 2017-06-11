'use strict';

const util = require('../util.js');
const handlerCache = require('../handler.cache.js');

/**
 * Extends handle message rapport functionality, adding progress update handling.
 *
 * @param {object} wrappedSocket The wrapped socket to add functionality to.
 */
const extendHandleMessage = (wrappedSocket) => {
    const previousHandleMessage = wrappedSocket._functions.onMessage.handleMessage;

    // Replace the handle message function with one that checks if it's a progress update
    wrappedSocket._functions.onMessage.handleMessage = (standardSocket, wrappedSocket, requestCache, options, msg, handler) => {
        if (util.isObject(msg) && msg._pu) {
            handlerCache.callHandler(msg._pu, msg._b);
        } else {
            previousHandleMessage(standardSocket, wrappedSocket, requestCache, options, msg, handler);
        }
    };
};

/**
 * Extends the rapport responder object, adding a `sendProgressUpdate` function.
 *
 * @param {object} wrappedSocket The wrapped socket to add functionality to.
 */
const extendCreateResponderObject = (wrappedSocket) => {
    const previousCreateResponderObject = wrappedSocket._functions.onMessage.createResponderObject;

    wrappedSocket._functions.onMessage.createResponderObject = (standardSocket, wrappedSocket, requestCache, options, requestId) => {
        const responder = previousCreateResponderObject(standardSocket, wrappedSocket, requestCache, options, requestId);

        responder.sendProgressUpdate = (message) => {
            wrappedSocket.sendProgressUpdate(requestId, message);
        };

        return responder;
    };
};

/**
 * Adds onMessage functionality to a rapport websocket.
 *
 * @param {object} wrappedSocket The websocket to extend.
 */
module.exports = (wrappedSocket) => {
    extendHandleMessage(wrappedSocket);
    extendCreateResponderObject(wrappedSocket);
};
