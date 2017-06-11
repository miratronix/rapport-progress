'use strict';

const handlers = {};

/**
 * Defines the progress handler cache.
 */
module.exports = {

    /**
     * Adds a handler for progress updates with a specified ID.
     *
     * @param {string} id The string ID to attach the handler for.
     * @param {function} handler The handler function to call on a progress update.
     */
    addHandler: (id, handler) => {
        handlers[id] = handler;
    },

    /**
     * Removes a handler from the progress update handler cache.
     *
     * @param {string} id The progress update ID to remove.
     */
    removeHandler: (id) => {
        delete handlers[id];
    },

    /**
     * Calls a progress update handler with a message.
     *
     * @param {string} id The progress update handler ID.
     * @param {*} message The message.
     */
    callHandler: (id, message) => {
        if (handlers[id]) {
            handlers[id](message);
        }
    }
};
