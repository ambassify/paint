'use strict';

import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import info from '../package.json';

if (process.env.ENVIRONMENT)
    dotenv.config({
        silent: true,
        path: path.join(__dirname, '../.env/' + process.env.ENVIRONMENT)
    });

dotenv.config({
    silent: true,
    path: path.join(__dirname, '../.env/default')
});

const server = express();

server.get('/', function(req, res) {
	res.status(200).send({ name: info.name, version: info.version });
});

server.listen( process.env.PORT );

console.log(
    info.name,
    'is listening with mode',
    process.env.ENVIRONMENT,
    'on port',
    process.env.PORT
);
