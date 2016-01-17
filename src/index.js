'use strict';

import _ from 'lodash';
import path from 'path';
import express from 'express';
import info from '../package.json';

import initEnv, { inProduction } from './helpers/environment';
import { setRoot } from './helpers/cache';
import logger from './helpers/logger';
import paint from './lib/paint';
import errorHandler from './middleware/errors';

initEnv(path.join(__dirname, '../.env'));
setRoot(path.join(__dirname, '../cache'));

const server = express();

// Pretty JSON when not in production
if (!inProduction())
    server.set('json spaces', 2);

server.use('/assets', express.static(path.join(__dirname, '../assets')));

server.get('/paint', function getPaint (req, res, next) {
    const source = req.query.src,
        url = req.query.uvar,
        vars = req.query.var,
        opts = req.query.opts;

    paint(source, url, vars, opts).then((result) => {
        res.status(200).type('css').send(result);
    }).catch((e) => {
        next ({ code: 500, message: 'Compile failed', error: e });
    });
});

server.get('/', function getRoot (req, res) {
    res.status(200).send({ name: info.name, version: info.version });
});

server.use(errorHandler);

server.listen( process.env.PORT );

logger.info(
    info.name,
    'is listening with mode',
    process.env.ENVIRONMENT,
    'on port',
    process.env.PORT
);
