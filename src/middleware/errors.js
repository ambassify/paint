'use strict';

import _ from 'lodash';
import { inProduction } from '../helpers/environment';

export default function errorHandler (err, req, res, next) {
    // Delegate to Express error handler if response was already started
    if (res.headersSent) {
        return next(err);
    }

    const error = _.isString(err) ? { message: err } : err,
        code = err.code || 500,
        message = err.message || 'Internal server error',
        body = err.body || {},
        originalError = err.error || false;

    body.code = body.code || code;
    body.message = body.message || message;

    if (originalError && !inProduction())
        body.error = (originalError.stack || originalError.toString()).split('\n');

    res.status(code).json(body);
}
