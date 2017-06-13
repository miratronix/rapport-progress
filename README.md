# rapport-progress [![CircleCI](https://circleci.com/gh/miratronix/rapport-progress.svg?style=shield)](https://circleci.com/gh/miratronix/rapport-progress) [![Coverage Status](https://coveralls.io/repos/github/miratronix/rapport-progress/badge.svg)](https://coveralls.io/github/miratronix/rapport-progress)
[![NPM](https://nodei.co/npm/rapport-progress.png)](https://npmjs.org/package/rapport-progress)

Adds mid-request progress updates to the [Rapport](https://github.com/miratronix/rapport) websocket library.

## Installation
Node: Install the plugin via NPM: `npm install --save rapport-progress`

Browser: Attach `rapport.progress.min.js` to your HTML page

Then add the plugin to Rapport:
```javascript
// Globally
Rapport.use(require('rapport-progress')); // In Node.js
Rapport.use(RapportProgress); // In the browser

// Or to a instance
Rapport(wsImplementation).use(require('rapport-progress')); // In Node.js
Rapport(wsImplementation).use(RapportProgress); // In the browser
```

## Standard Usage
This plugin adds mid-request progress updates to the rapport responder object. Simply add a listener when making a request:
```javascript
const Rapport = Rapport(Websocket);
const ws = Rapport.create('ws:localhost', wsOptions);

// On a client with promises
ws.request('Something that takes a long time', timeout, 
    (progressUpdate) => {
        console.log('Got a progress update:' + progressUpdate);
    }
).then((response) => {
    console.log('Got a final response!');
});

// On a client with callbacks
ws.request('Something that takes a long time', timeout, 
    (response) => {
        console.log('Got a final response!');
    },
    (progressUpdate) => {
        console.log('Got a progress update:' + progressUpdate);
    }
);

// On the server
ws.onMessage((message, ws) => {
    
    // Do something that takes a while, send progress updates while doing so
    ws.sendProgressUpdate('Progress update!');
    
    // Send the final response
    ws.respond('Final response');
})
```

## Usage with rapport-router and rapport-http
When using this plugin in conjunction with [rapport-router](https://github.com/miratronix/rapport-router) or [rapport-http](https://github.com/miratronix/rapport-http), make sure you add the plugin to rapport _AFTER_ adding those:
```javascript
const rapport = Rapport().use(RapportRouter).use(RapportProgress); // Right
const rapport = Rapport().use(RapportProgress).use(RapportRouter); // Wrong!
```

Once the plugin has been added, usage is similar to the standard usage, above:

```javascript
// Server side
const router = rapport.Router();
router.get('/test', (req, res) => {
    res.sendProgressUpdate('Progress update!');
    res.send('Final response');
});
rapport.wrap(existingSocket, { router: router });

// Client side with promises
const ws = rapport.websocket(WebSocket).create('ws:localhost');
ws.get('/test')
    .onProgressUpdate((progressUpdate) => {
        console.log('Got a progress update:' + progressUpdate);
    })
    .send()
    .then((response) => {
        console.log('Got a final response!');
    });

// Client side with callbacks
const ws = rapport.websocket(WebSocket).create('ws:localhost', { Promise: false });
ws.get('/test')
    .onProgressUpdate((progressUpdate) => {
        console.log('Got a progress update:' + progressUpdate);
    })
    .send((response) => {
        console.log('Got a final response!');
    });
```
