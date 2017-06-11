'use strict';

const handlerCache = require('../handler.cache.js');

/**
 * Extends rapport request functionality, adding a progress update callback parameter.
 *
 * @param {object} wrappedSocket The rapport websocket.
 * @param {object} requestCache The rapport request cache.
 * @param {object} options The rapport options.
 * @param {*} body The request body.
 * @param {number} timeout The timeout for the request, in milliseconds.
 * @param {function} cb The callback to make when the request is complete.
 * @param {function} progressCb The progress function to call when a progress update is received.
 * @return {Promise|undefined} A promise if promises are enabled, undefined otherwise.
 */
const request = (wrappedSocket, requestCache, options, body, timeout, cb, progressCb) => {

    const wrappedRequest = {
        _rq: options.generateRequestId(),
        _b: body
    };

    if (timeout) {
        setTimeout(() => {
            requestCache.reject(wrappedRequest._rq, new Error(`Timed out after ${timeout} ms`));
        }, timeout);
    }

    let responseCallback = cb;
    let progressCallback = progressCb;

    // We're using a promise implementation, have a callback, and have no progress callback, use the callback as the progress callback
    if (options.Promise && cb && !progressCb) {
        responseCallback = null;
        progressCallback = cb;
    }

    if (progressCallback) {
        handlerCache.addHandler(wrappedRequest._rq, progressCallback);
    }

    if (responseCallback) {
        requestCache.addCallback(wrappedRequest._rq, responseCallback);
        wrappedSocket.send(wrappedRequest);

    } else if (options.Promise) {
        return new options.Promise((resolve, reject) => {
            requestCache.addPromise(wrappedRequest._rq, resolve, reject);
            wrappedSocket.send(wrappedRequest);
        });

    } else {
        throw new Error('Can\'t make a request without a Promise implementation or callback');
    }
};

/**
 * Extends request functionality for a rapport websocket.
 *
 * @param {object} wrappedSocket The wrapped rapport websocket.
 * @param {object} requestCache The rapport request cache.
 * @param {object} options The rapport options.
 */
module.exports = (wrappedSocket, requestCache, options) => {
    wrappedSocket._functions.request = request;
    wrappedSocket.request = wrappedSocket._functions.request.bind(null, wrappedSocket, requestCache, options);
};
