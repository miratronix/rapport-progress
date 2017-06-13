'use strict';

const handlerCache = require('../handler.cache.js');
const addSendProgressUpdate = require('./send.progress.update.js');
const extendOnMessage = require('./on.message.js');
const extendRequest = require('./request.js');
const extendHttp = require('./http.js');
const extendRouter = require('./router.js');

/**
 * Extends the request cache implementation, adding progress update handler removal on request completion.
 *
 * @param {object} requestCache The request cache to extend.
 */
const extendRequestCache = (requestCache) => {
    const previousResolve = requestCache.resolve;
    const previousReject = requestCache.reject;

    requestCache.resolve = (requestId, response) => {
        handlerCache.removeHandler(requestId);
        previousResolve(requestId, response);
    };

    requestCache.reject = (requestId, error) => {
        handlerCache.removeHandler(requestId);
        previousReject(requestId, error);
    };
};

/**
 * Adds progress update functionality to a Rapport websocket.
 *
 * @param {object} wrappedSocket The websocket to extend.
 * @param {object} standardSocket The standard socket.
 * @param {object} requestCache The request cache.
 * @param {object} options The websocket options.
 */
module.exports = (wrappedSocket, standardSocket, requestCache, options) => {
    addSendProgressUpdate(wrappedSocket);
    extendRequest(wrappedSocket, requestCache, options);
    extendOnMessage(wrappedSocket);
    extendRequestCache(requestCache);

    // Add extensions for other plugins
    extendRouter(wrappedSocket);
    extendHttp(wrappedSocket);
};
