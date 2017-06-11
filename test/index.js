'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const Util = {

    mockNodeWebsocket: () => {
        const ws = {
            messagesSent: 0,
            lastSentMessage: '',

            closed: false,
            closeCode: 0,
            closeMessage: '',

            handlers: {
                message: [],
                close: [],
                error: [],
                open: []
            },

            fire: (type, ...data) => {
                for (let i = 0; i < ws.handlers[type].length; i++) {
                    ws.handlers[type][i](...data);
                }
            },

            send: (msg) => {
                ws.messagesSent++;
                ws.lastSentMessage = msg;
            },

            close: (code, msg) => {
                ws.closed = true;
                ws.closeCode = code;
                ws.closeMessage = msg;
            },

            on: (type, handler) => {
                ws.handlers[type].push(handler);
            },

            removeAllListeners: (type) => {
                ws.handlers[type] = [];
            }
        };

        return ws;
    },
};

module.exports = Util;
