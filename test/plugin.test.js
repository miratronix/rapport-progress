'use strict';

const Rapport = require('rapport');
const util = require('./index.js');
const plugin = require('../lib/index.js');

describe('Plugin', () => {

    let rapport;
    let testSocket;

    beforeEach(() => {
        rapport = Rapport().use(plugin);
        testSocket = rapport.wrap(util.mockNodeWebsocket());
    });

    it('Adds the sendProgressUpdate method to the wrapped websocket', () => {
        testSocket.should.have.a.property('sendProgressUpdate').that.is.a('function');
    });

    it('Adds itself to the window if it\'s present', () => {
        global.window = {};
        delete require.cache[require.resolve('../lib/index.js')];
        require('../lib/index.js');
        global.window.should.have.a.property('RapportProgress').that.is.an('object');
        delete global.window;
    });
});
