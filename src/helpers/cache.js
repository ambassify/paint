import _ from 'lodash';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

let _root = null;

const _tryHashes = [ 'md5', 'sha1', 'sha256', 'sha512' ];
const _allHashes = crypto.getHashes();
let _hash = _.intersection(_tryHashes, _allHashes).shift();

if (!_hash) {
    _hash = _allHashes.pop();
    console.log('Using non-preferred hashing in filesystem helper:', _hash);
}

function _ensureRoot () {
    if (!_root)
        throw new Error('Root for filesystem helper is not set.');
}

export function setRoot (p) {
    if (!fs.existsSync(p))
        throw new Error('Failed to set root for filesytem helper, path doet not exist.');

    _root = p;
}

export function getDirectoryForPath(p) {
    _ensureRoot();
    const hash = crypto.createHash(_hash).update(p).digest('hex');
    const destination = path.join(_root, hash);

    if (!fs.existsSync(destination))
        fs.mkdirSync(destination);

    return destination;
}

export function getFileForPath(p) {
    _ensureRoot();
    const hash = crypto.createHash(_hash).update(p).digest('hex');
    return path.join(_root, hash);
}

export function getWriteStream(file) {
    return fs.createWriteStream(file);
}