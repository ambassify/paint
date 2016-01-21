import http from 'http';
import https from 'https';
import fs from 'fs';

import { getFileForPath } from './cache';

function _request(url, cb) {
    const agent = url.indexOf('https') === 0 ? https : http;
    const request = agent.get(url, (res) => {

        const statusCode = res.statusCode;

        if (statusCode.toString().substr(0, 1) != 2) {
            cb(new Error(`Request failed with code ${statusCode}`));
        }

        cb(null, res);

    }).on('error', (err) => {
        request.abort();
        cb(err);
    }).on('socket', (socket) => {
        socket.setTimeout(15000);
        socket.on('timeout', () => {
            request.abort();
            cb(new Error('Request timeout'));
        });
    });
}

export function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const cacheDir = getFileForPath(url);

        if (cacheDir.exists)
            return resolve(cacheDir.path);

        const stream = fs.createWriteStream(cacheDir.path);

        try {
            _request(url, (err, res) => {
                if (err)
                    return reject(err);

                res.pipe(stream);
                res.on('end', () => {
                    resolve(cacheDir.path);
                });
            });
        } catch (e) {
            throw e;
        }
    });
}

export function download (url) {
    return downloadFile(url).then((location) => {
        return fs.readFileSync(location, 'utf8');
    });
}
