'use strict';

/**
 * Collection of utility methods.
 */
const Util = {

    /**
     * Determines if a parameter is an object.
     *
     * @param {*} obj The parameter to check.
     * @return {boolean} True if object, false otherwise.
     */
    isObject: (obj) => {
        return typeof obj === 'object';
    }
};

module.exports = Util;
