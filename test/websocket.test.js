'use strict';

const Rapport = require('rapport');
const RapportRouter = require('rapport-router');
const RapportHttp = require('rapport-http');

const util = require('./index.js');
const plugin = require('../lib/index.js');
const handlerCache = require('../lib/handler.cache.js');

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
            const testSocket = rapport.wrap(mockSocket, { Promise: false });

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

    context('rapport-router', () => {

        it('Adds a real sendProgressUpdate to the responder object when the message is a request', () => {
            return new Promise((resolve) => {
                testSocket = Rapport().use(RapportRouter).use(plugin).wrap(mockSocket, {
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

        it('Adds a no-op sendProgressUpdate to the responder object when the message is not a request', () => {
            return new Promise((resolve) => {
                testSocket = Rapport().use(RapportRouter).use(plugin).wrap(mockSocket, {
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
    });

    context('rapport-http', () => {

        it('Adds a onProgressUpdate function', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);
            testSocket.http('put', '/test').should.have.a.property('onProgressUpdate').that.is.a('function');
        });

        it('Adds a onProgressUpdate function to get', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);
            testSocket.get('/test').should.have.a.property('onProgressUpdate').that.is.a('function');
        });

        it('Adds a onProgressUpdate function to post', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);
            testSocket.post('/test').should.have.a.property('onProgressUpdate').that.is.a('function');
        });

        it('Adds a onProgressUpdate function to put', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);
            testSocket.put('/test').should.have.a.property('onProgressUpdate').that.is.a('function');
        });

        it('Adds a onProgressUpdate function to delete', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);
            testSocket.delete('/test').should.have.a.property('onProgressUpdate').that.is.a('function');
        });

        it('Adds a onProgressUpdate function to patch', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);
            testSocket.patch('/test').should.have.a.property('onProgressUpdate').that.is.a('function');
        });

        it('Calls the progress update handler when a progress update is received using promises', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);

            return new Promise((resolve, reject) => {
                testSocket.get('/test')
                    .onProgressUpdate(resolve)
                    .send()
                    .then((reject));
                const message = JSON.parse(mockSocket.lastSentMessage);
                mockSocket.fire('message', JSON.stringify({
                    _pu: message._rq,
                    _b: 'Hello'
                }));
            });
        });

        it('Calls the progress update handler when a progress update is received using callbacks', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);

            return new Promise((resolve, reject) => {
                testSocket.get('/test')
                    .onProgressUpdate(resolve)
                    .send(reject);
                const message = JSON.parse(mockSocket.lastSentMessage);
                mockSocket.fire('message', JSON.stringify({
                    _pu: message._rq,
                    _b: 'Hello'
                }));
            });
        });

        it('Still sends the request object alone when no response is expected', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);

            testSocket.http('get', '/test').body('hello').expectResponse(false).send();
            const lastSentMessage = JSON.parse(mockSocket.lastSentMessage);
            lastSentMessage.should.have.a.property('_u').that.equals('/test');
            lastSentMessage.should.have.a.property('_m').that.equals('get');
            lastSentMessage.should.have.a.property('_b').that.equals('hello');
        });

        it('Still translates a good response when using a callback', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket, { Promise: false });

            return new Promise((resolve) => {
                testSocket.http('get', '/test').send((res) => {
                    res.should.have.a.property('status').that.equals(42);
                    res.should.have.a.property('body').that.equals('hello');
                    resolve();
                });
                mockSocket.fire('message', {
                    _rs: JSON.parse(mockSocket.lastSentMessage)._rq,
                    _b: {
                        _s: 42,
                        _b: 'hello'
                    }
                });
            });
        });

        it('Still translates an error response when using a callback', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket, { Promise: false });

            return new Promise((resolve) => {
                testSocket.http('get', '/test').send((res, err) => {
                    err.should.have.a.property('status').that.equals(42);
                    err.should.have.a.property('body').that.equals('goodbye');
                    resolve();
                });
                mockSocket.fire('message', {
                    _rs: JSON.parse(mockSocket.lastSentMessage)._rq,
                    _e: {
                        _s: 42,
                        _b: 'goodbye'
                    }
                });
            });
        });

        it('Still translates a good response when using promises', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);

            return new Promise((resolve) => {
                testSocket.http('get', '/test').send().then((res) => {
                    res.should.have.a.property('status').that.equals(42);
                    res.should.have.a.property('body').that.equals('hello');
                    resolve();
                });
                mockSocket.fire('message', {
                    _rs: JSON.parse(mockSocket.lastSentMessage)._rq,
                    _b: {
                        _s: 42,
                        _b: 'hello'
                    }
                });
            });
        });

        it('Still translates an error response when using promises', () => {
            testSocket = Rapport().use(RapportHttp).use(plugin).wrap(mockSocket);

            return new Promise((resolve) => {
                testSocket.http('get', '/test').send().catch((err) => {
                    err.should.have.a.property('status').that.equals(42);
                    err.should.have.a.property('body').that.equals('goodbye');
                    resolve();
                });
                mockSocket.fire('message', {
                    _rs: JSON.parse(mockSocket.lastSentMessage)._rq,
                    _e: {
                        _s: 42,
                        _b: 'goodbye'
                    }
                });
            });
        });
    });
});
