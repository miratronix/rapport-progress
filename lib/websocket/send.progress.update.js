'use strict';

/**
 * Sends a progress update on the socket.
 *
 * @param {object} wrappedSocket The rapport websocket to send on.
 * @param {string} requestId The ID of the request.
 * @param {*} body The progress update body.
 */
const sendProgressUpdate = (wrappedSocket, requestId, body) => {
    wrappedSocket.send({
        _pu: requestId,
        _b: body
    });
};

/**
 * Adds `sendProgressUpdate` functionality to a rapport websocket.
 *
 * @param {object} wrappedSocket The rapport socket.
 */
module.exports = (wrappedSocket) => {
    wrappedSocket._functions.sendProgressUpdate = sendProgressUpdate;
    wrappedSocket.sendProgressUpdate = wrappedSocket._functions.sendProgressUpdate.bind(null, wrappedSocket);
};
