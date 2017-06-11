'use strict';

const extendWebsocket = require('./websocket/index.js');

/**
 * Defines the Rapport plugin.
 */
const RapportPlugin = {

    /**
     * Adds progress update functionality to the Rapport websocket.
     *
     * @param {object} wrappedSocket The websocket to extend.
     * @param {object} standardSocket The standardized socket.
     * @param {object} requestCache The request cache for the socket.
     * @param {object} options The websocket options.
     */
    extendWebsocket: (wrappedSocket, standardSocket, requestCache, options) => {
        extendWebsocket(wrappedSocket, standardSocket, requestCache, options);
    }
};

if (typeof window !== 'undefined') {
    window.RapportProgress = RapportPlugin;
}

if (typeof module !== 'undefined') {
    module.exports = RapportPlugin;
}
