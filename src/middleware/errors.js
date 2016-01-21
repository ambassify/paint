'use strict';

import _ from 'lodash';
import { inProduction } from '../helpers/environment';
import logger, { logForLevel } from '../helpers/logger';
import { PaintError, PaintHttpError } from '../lib/error';

export default function errorHandler (err, req, res, next) {
    if (err instanceof PaintError) {
        const level = err.getSeverity();
        logForLevel(level)(err);
    } else if (err instanceof Error) {
        // This means an error occured that is not explicitly handled by our own
        // code, someone should probably look at it.
        logger().warn(
            { err }, 'Error handler was called with non-PaintHttpError'
        );
    } else {
        // It's not fatal, but this code should NEVER be reached because we
        // want all errors in the application to be nicely handled and have
        // stack traces.
        logger().fatal({ err: err }, 'Error handler was called with non-Error');
    }

    // Delegate to Express error handler if response was already started
    if (res.headersSent) {
        return next(err);
    }

    let code = 500;
    const body = { code };

    if (err instanceof PaintHttpError) {
        body.code = code = err.code;
    }

    if (err instanceof Error) {
        body.message = err.toString();
        body.error = err.stack.split('\n');
    } else {
        body.message = _.isFunction(err.toString) ?
            err.toString() : 'Unkown error';
    }

    if (inProduction())
        delete body.error;

    res.status(code).json(body);
}
