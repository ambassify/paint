import fs from 'fs';
import tar from 'tar-fs';
import zlib from 'zlib';
import pumpify from 'pumpify';
import fileType from 'file-type';
import readChunk from 'read-chunk';

import { getDirectoryForPath, getWriteStream } from './cache';

function _getType (path) {
    const info = fileType(readChunk.sync(path, 0, 262));
    return info ? info.ext : null;
}

function _canHandle (type) {
    return type === 'gz' || type === 'tar';
}

export function canHandle (path) {
    return _canHandle(_getType(path));
}

export default function unarchive (path) {
    return new Promise((resolve, reject) => {

        const type = _getType(path);

        if (!_canHandle(type))
            throw new Error(`unarchive helper does not support type ${type}`);

        const destionationDir = getDirectoryForPath(path);

        const read = fs.createReadStream(path)
            .on('error', () => { throw new Error(`Failed to read file. ${path}`);});

        const pipeline = [];

        if (type === 'gz')
            pipeline.push(zlib.createUnzip());

        pipeline.push(tar.extract(destionationDir));

        read.pipe(pumpify(pipeline))
            .on('error', () => { throw new Error(`Failed to extract archive. ${path}`);})
            .on('finish', () => { resolve(destionationDir); });
    });
}
