import uuid from 'uuid';

import { addLoggerContext } from '../helpers/logger';

export default function (req, res, next) {
    const logref = req.get('X-Request-Id') || uuid.v4();

    req = {
        method: req.method,
        url: req.originalUrl,
        params: JSON.stringify(req.params),
        query: JSON.stringify(req.query)
    };

    addLoggerContext({ logref, req });
    next();
}
