import request from 'superagent';
import fs from 'fs';

import { getFileForPath, getWriteStream } from './cache';

export function download (url) {
    return new Promise((resolve, reject) => {
        try {
            request.get(url).end((err, res) => {
                if (err || !res.ok) {
                    return reject(err || res.status);
                }

                resolve(res.body);
            });
        } catch (e) {
            throw new Error('Superagent failed');
        }
    });
}

export function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const local = getFileForPath(url);

        try {
            request.get(url).buffer(false).end((err, res) => {
                if (err || !res.ok) {
                    return reject(err || res.status);
                }

                const stream = getWriteStream(local);

                stream.on('finish', () => { resolve(local); });
                stream.on('error', (e) => { reject(e); });

                res.pipe(stream);
            });
        } catch (e) {
            throw new Error('Superagent failed');
        }
    });
}
