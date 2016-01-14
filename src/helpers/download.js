import http from 'http';
import https from 'https';
import fs from 'fs';

import { getFileForPath, getWriteStream } from './cache';

function _request(url, cb) {
    const agent = url.indexOf('https') === 0 ? https : http;
    const request = agent.get(url, (res) => {

        const statusCode = res.statusCode;

        if (statusCode.toString().substr(0, 1) != 2) {
            throw new Error(`Request failed with code ${statusCode}`);
        }

        cb(res);

    }).on('error', (err) => {
        request.abort();
        throw err;
    }).on('socket', (socket) => {
        socket.setTimeout(15000);
        socket.on('timeout', () => {
            request.abort();
            throw new Error('Request timeout');
        });
    });
}

export function download (url) {
    return new Promise((resolve, reject) => {
        try {
            _request(url, (res) => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) { body += chunk; });
                res.on('end', () => {
                    resolve(body);
                });
            });
        } catch (e) {
            throw e;
        }
    });
}

export function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const local = getFileForPath(url);
        const stream = getWriteStream(local);

        try {
            _request(url, (res) => {
                res.pipe(stream);
                res.on('end', () => {
                    resolve(local);
                });
            });
        } catch (e) {
            throw e;
        }
    });
}
