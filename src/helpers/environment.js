'use strict';

import dotenv from 'dotenv';
import path from 'path';

export default
function initialize (envPath, opts = {}) {
    if (opts.ENVIRONMENT || process.env.ENVIRONMENT) {

        process.env.ENVIRONMENT = opts.ENVIRONMENT || process.env.ENVIRONMENT;

        dotenv.config({
            silent: true,
            path: path.join(envPath, process.env.ENVIRONMENT)
        });
    }

    dotenv.config({
        silent: true,
        path: path.join(envPath, 'default')
    });
}

export function inProduction () {
    return process.env.ENVIRONMENT === 'production';
}

export function inTesting () {
    return process.env.ENVIRONMENT === 'testing';
}
