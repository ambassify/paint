import http from 'http';
import https from 'https';
import fs from 'fs';

import logger from './logger';
import { getFileForPath } from './cache';
import { ResourceError } from '../lib/error';

function _log(verbose, ...args) {
    if (verbose)
        logger().info({ context: 'download' }, ...args);
}

function _request(url, cb, verbose = false) {
    const agent = url.indexOf('https') === 0 ? https : http;
    const request = agent.get(url, (res) => {

        const statusCode = res.statusCode;

        _log(verbose, 'status %s for %s', statusCode, url);

        if (statusCode.toString().substr(0, 1) == 2) {
            cb(null, res);
        } else {
            cb(new ResourceError(url, `response code ${statusCode}`));
        }
    }).on('error', (err) => {
        request.abort();
        cb(new ResourceError(url, err.toString()));
    }).on('socket', (socket) => {
        socket.setTimeout(15000);
        socket.on('timeout', () => {
            request.abort();
            cb(new ResourceError(url, `timeout`));
        });
    });
}

export function downloadFile(url, verbose = false) {
    return new Promise((resolve, reject) => {
        const cacheDir = getFileForPath(url);


        if (cacheDir.exists) {
            _log(verbose, 'serve %s from local cache', url);
            return resolve(cacheDir.path);
        }

        try {
            _request(url, (err, res) => {
                if (err)
                    _log(verbose, 'error from %s', url);

                if (err)
                    return reject(err);

                const stream = fs.createWriteStream(cacheDir.path);
                res.pipe(stream);
                res.on('data', (chunk) => _log(verbose, 'chunk from %s: %s', url, chunk));
                stream.on('finish', () => {
                    resolve(cacheDir.path);
                });
            }, verbose);
        } catch (e) {
            reject(e);
        }
    });
}

export function download (url, verbose = false) {
    return downloadFile(url, verbose).then((location) => {
        _log(verbose, '%s saved to %s', url, location);
        return fs.readFileSync(location, 'utf8');
    });
}
