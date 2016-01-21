import uuid from 'uuid';

import { addLoggerContext } from '../helpers/logger';

export default function (req, res, next) {
    const request = {
        id: req.get('X-Request-Id') || uuid.v4(),
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query
    };

    addLoggerContext({ req: request });
    next();
}
