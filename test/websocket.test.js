'use strict';

const Rapport = require('rapport');
const RapportRouter = require('rapport-router');
const manualWrap = require('rapport/lib/websocket/index.js');
const manualStandardize = require('rapport/lib/standardize.js');
const manualRequestCache = require('rapport/lib/request.cache.js');
const manualOptions = require('rapport/lib/options.js');

const util = require('./index.js');
const plugin = require('../lib/index.js');
const handlerCache = require('../lib/handler.cache.js');
const extendRequest = require('../lib/websocket/request.js');

describe('Websocket', () => {

    let rapport;
    let mockSocket;
    let testSocket;

    beforeEach(() => {
        rapport = Rapport().use(plugin);
        mockSocket = util.mockNodeWebsocket();
        testSocket = rapport.wrap(mockSocket);
    });

    context('requestCache', () => {

        it('Removes progress handlers when a request is resolved', () => {
            return new Promise((resolve, reject) => {
                testSocket.request('Hello', 0, reject)
                    .then(() => {
                        handlerCache.callHandler(message._rq, message._b); // If the handler was still there, this would reject
                        resolve();
                    });
                const message = JSON.parse(mockSocket.lastSentMessage);
                mockSocket.fire('message', JSON.stringify({ _rs: message._rq, _b: 'Hey there' }));
            });
        });

        it('Removes progress handlers when a request is rejected', () => {
            return new Promise((resolve, reject) => {
                testSocket.request('Hello', 0, reject)
                    .catch(() => {
                        handlerCache.callHandler(message._rq, message._b); // If the handler was still there, this would reject
                        resolve();
                    });
                const message = JSON.parse(mockSocket.lastSentMessage);
                mockSocket.fire('message', JSON.stringify({ _rs: message._rq, _e: 'Hey there' }));
            });
        });
    });

    context('onMessage()', () => {

        it('Still handles regular messages', () => {
            return new Promise((resolve) => {
                testSocket.onMessage((msg) => {
                    msg.isRequest.should.equal(false);
                    msg.should.have.a.property('body');
                    msg.body.should.have.a.property('hello').that.equals('world');
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ hello: 'world' }));
            });
        });

        it('Still handles request messages', () => {
            return new Promise((resolve) => {
                testSocket.onMessage((msg) => {
                    msg.isRequest.should.equal(true);
                    msg.should.have.a.property('body');
                    msg.body.should.have.a.property('hello').that.equals('world');
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ _rq: 'hello', _b: { hello: 'world' } }));
            });
        });

        it('Adds a sendProgressUpdate to the responder object', () => {
            return new Promise((resolve) => {
                testSocket.onMessage((msg, ws) => {
                    ws.should.have.a.property('sendProgressUpdate').that.is.a('function');
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ _rq: 'hello', _b: { hello: 'world' } }));
            });
        });

        it('Adds a real sendProgressUpdate to the rapport-router responder object when the message is a request', () => {
            rapport.use(RapportRouter);
            rapport.use(plugin);

            return new Promise((resolve) => {
                testSocket = rapport.wrap(mockSocket, {
                    router: {
                        handle: (req, res) => {
                            res.should.have.a.property('sendProgressUpdate').that.is.a('function');
                            res.sendProgressUpdate('Progress!');
                            const message = JSON.parse(mockSocket.lastSentMessage);
                            message.should.have.a.property('_pu');
                            message.should.have.a.property('_b').that.equals('Progress!');
                            resolve();
                        }
                    }
                });
                mockSocket.fire('message', JSON.stringify({
                    _rq: 'requestId',
                    _b: {
                        _u: 'url',
                        _m: 'method',
                        _b: 'body'
                    }
                }));
            });
        });

        it('Adds a no-op sendProgressUpdate to the rapport-router responder object when the message is not a request', () => {
            rapport.use(RapportRouter);
            rapport.use(plugin);

            return new Promise((resolve) => {
                testSocket = rapport.wrap(mockSocket, {
                    router: {
                        handle: (req, res) => {
                            res.should.have.a.property('sendProgressUpdate').that.is.a('function');
                            res.sendProgressUpdate('Progress!');
                            mockSocket.lastSentMessage.should.equal('');
                            resolve();
                        }
                    }
                });
                mockSocket.fire('message', JSON.stringify({
                    _u: 'url',
                    _m: 'method',
                    _b: 'body'
                }));
            });
        });

        it('Can send a progress update using the responder object', () => {
            return new Promise((resolve) => {
                testSocket.onMessage((msg, ws) => {
                    ws.sendProgressUpdate('Progress!');
                    const message = JSON.parse(mockSocket.lastSentMessage);
                    message.should.have.a.property('_pu').that.equals('hello');
                    message.should.have.a.property('_b').that.equals('Progress!');
                    resolve();
                });
                mockSocket.fire('message', JSON.stringify({ _rq: 'hello', _b: { hello: 'world' } }));
            });
        });
    });

    context('request()', () => {

        it('Wraps the request and sends it', () => {
            testSocket.request('Some request', 0, () => {});
            mockSocket.messagesSent.should.equal(1);
            const message = JSON.parse(mockSocket.lastSentMessage);

            message.should.have.a.property('_rq').that.is.a('string');
            message.should.have.a.property('_b').that.equals('Some request');
        });

        it('Adds a timeout if one is specified', () => {
            return testSocket.request('Hello', 10)
                .should.be.rejectedWith(Error, 'Timed out after 10 ms');
        });

        it('Calls the progress handler when using request promises', () => {
            return new Promise((resolve) => {
                testSocket.request('Hello', 0, (update) => {
                    update.should.be.a('string').that.equals('Yup');
                    resolve();
                });
                const message = JSON.parse(mockSocket.lastSentMessage);
                mockSocket.fire('message', { _pu: message._rq, _b: 'Yup' });
            });
        });

        it('Calls the progress handler when using request callbacks', () => {
            testSocket = rapport.wrap(mockSocket, { Promise: undefined });
            return new Promise((resolve, reject) => {
                testSocket.request('Hello', 0, reject, (update) => {
                    update.should.be.a('string').that.equals('Yup');
                    resolve();
                });
                const message = JSON.parse(mockSocket.lastSentMessage);
                mockSocket.fire('message', { _pu: message._rq, _b: 'Yup' });
            });
        });

        it('Throws an error if a callback is not supplied and there is no Promise object', () => {
            const options = manualOptions();
            const requestCache = manualRequestCache();
            const standardSocket = manualStandardize(mockSocket);
            const testSocket = manualWrap(standardSocket, requestCache, options);

            delete options.Promise;

            extendRequest(testSocket, requestCache, options);
            (() => {
                testSocket.request('Something');
            }).should.throw(Error, 'Can\'t make a request without a Promise implementation or callback');
        });
    });

    context('sendProgressUpdate()', () => {

        it('Sends a progress update message', () => {
            testSocket.sendProgressUpdate('someId', { hello: 'world' });
            mockSocket.lastSentMessage.should.be.a('string').that.equals(JSON.stringify({
                _pu: 'someId',
                _b: { hello: 'world' }
            }));
        });
    });
});
