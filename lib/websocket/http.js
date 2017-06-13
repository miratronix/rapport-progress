'use strict';

/**
 * Translates a response from a websocket packet.
 *
 * @param {*} res The response.
 */
const translateResponse = (res) => {
    if (res) {
        res.status = res._s;
        delete res._s;

        res.body = res._b;
        delete res._b;
    }

    return res;
};

/**
 * Extends the rapport-http object with onProgress update functionality.
 *
 * @param {object} wrappedSocket The wrapped socket.
 */
const extendHttpObject = (wrappedSocket) => {
    const previousHttp = wrappedSocket._functions.http;

    if (previousHttp) {
        wrappedSocket._functions.http = (wrappedSocket, method, url) => {
            const req = previousHttp(wrappedSocket, method, url);

            req.onProgressUpdate = (handler) => {
                req._progressHandler = handler;
                return req;
            };

            req.send = (cb) => {
                const body = {
                    _m: req._method,
                    _u: req._url,
                    _b: req._body
                };

                if (!req._expectResponse) {
                    return wrappedSocket.send(body);
                }

                if (cb) {
                    return wrappedSocket.request(body, req._timeout, (res, err) => {
                        cb(translateResponse(res), translateResponse(err));
                    }, req._progressHandler);
                }

                return wrappedSocket.request(body, req._timeout, req._progressHandler)
                    .then(translateResponse, (err) => {
                        throw translateResponse(err);
                    });
            };

            return req;
        };

        wrappedSocket.http = wrappedSocket._functions.http.bind(null, wrappedSocket);
    }
};

/**
 * Extends HTTP functionality with an onProgress handler.
 *
 * @param {object} wrappedSocket The websocket to extend.
 */
module.exports = (wrappedSocket) => {
    extendHttpObject(wrappedSocket);
};
