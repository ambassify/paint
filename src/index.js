'use strict';

import _ from 'lodash';
import path from 'path';
import express from 'express';
import info from '../package.json';

import initEnv, { inProduction } from './helpers/environment';
import { setRoot } from './helpers/cache';
import logger, { addLoggerContext } from './helpers/logger';
import { isUrl } from './helpers/url';
import paint from './lib/paint';
import { InvalidParameterError } from './lib/error';
import errorHandler from './middleware/errors';
import loggerContext from './middleware/logger-context';

initEnv(path.join(__dirname, '../env'));
setRoot(path.join(__dirname, '../cache'));
addLoggerContext({ version: info.version });

const server = express();

// Pretty JSON when not in production
if (!inProduction())
    server.set('json spaces', 2);

server.use('/assets', express.static(path.join(__dirname, '../assets')));

server.use(loggerContext);

server.get('/paint', function getPaint (req, res, next) {
    logger().info({ context: 'express', endpoint: 'paint' }, 'Received request');

    const source = req.query.src,
        url = req.query.uvar,
        vars = req.query.var,
        opts = req.query.opt,
        invalid = [];

    if (!_.isString(source) || !source.length)
        invalid.push('src');

    if (url && !isUrl(url))
        invalid.push('uvar');

    if (vars && !_.isPlainObject(vars))
        invalid.push('var');

    if (opts && !_.isPlainObject(opts))
        invalid.push('opt');

    if(invalid.length)
        throw new InvalidParameterError(invalid);

    paint(source, url, vars, opts).then((result) => {
        logger().info({ context: 'express', endpoint: 'paint' }, 'Sending response');

        res
            .status(200)
            .type('css')
            .set('Cache-Control', 'public, max-age=31556926') // 1 year
            .send(result);
    }).catch((e) => {
        next (e);
    });
});

server.get('/', function getRoot (req, res) {
    res.status(200).send({ name: info.name, version: info.version });
});

server.use(errorHandler);

server.listen( process.env.PORT );

logger().info(
    info.name,
    'is listening with mode',
    process.env.ENVIRONMENT,
    'on port',
    process.env.PORT
);
