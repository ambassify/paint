'use strict';

import fs from 'fs';
import sass from 'node-sass';
import _ from 'lodash';

import logger from '../helpers/logger';
import { download, downloadFile } from '../helpers/download';
import unpack, { canHandle as isArchive } from '../helpers/unarchive';
import sassCompile, {
    optionsForFile as sassFileOptions,
    optionsForDirectory as sassDirectoryOptions,
    optionsForData as sassDataOptions
} from '../helpers/sass';

const SASS_OPTIONS = {
    outputStyle: 'compressed'
};

function _isUrl (url) {
    return /^http/.test(url);
}

function _downloadVariables (url) {
    if (!url)
        return {};

    logger.info({ context: 'variables' }, 'Downloading variables from %s', url);

    return download(url)
        .catch((e) => {
            throw new Error(`'Failed to download [${url}]`);
        })
        .then((contents) => {
            let variables = contents;

            // Superagent should have handled this, but we try once more
            // in case the source didn't set Content-Type correctly
            if (_.isString(contents)) {
                try {
                    variables = JSON.parse(contents);
                } catch (e) { }
            }

            if (!_.isPlainObject(variables)) {
                throw new Error(`'Invalid variables supplied at [${url}]`);
            }

            return variables;
        });
}

function _assignVariables (map, variables = null) {
    if (variables && !_.isPlainObject(variables))
        throw new Error('Invalid variables');

    if (variables) {
        _.forEach(variables, (v, k) => {
            if (!_.isString(v))
                throw new Error(
                    `Invalid variable [${k}]: ${JSON.stringify(v)}`
                );

            map[k] = v;
        });
    }

    return map;
}

function _ensureLocal (isUrl, source) {
    if (!isUrl)
        return source;

    logger.info({ context: 'source' }, 'Downloading source from %s', source);

    return downloadFile(source);
}

function _ensureUnpacked (isFile, source) {
    if (!isFile || !isArchive(source))
        return source;

    logger.info({ context: 'source' }, 'Unpacking downloaded source');

    return unpack(source);
}

function _makeSassOptions (isUrl, source, vars, baseOptions) {
    logger.info({ context: 'sass' }, 'Generating sass variables');

    if (!isUrl)
        return sassDataOptions(source, vars, baseOptions);

    return fs.statSync(source).isDirectory() ?
        sassDirectoryOptions(source, vars, baseOptions) :
        sassFileOptions(source, vars, baseOptions);
}

function _sassCompile (options) {
    logger.info({ context: 'sass' }, 'Compiling sass');

    return sassCompile(options);
}

export default
function Paint (source, variablesUrl = null, variables = null, options = {}) {
    const isUrl = _isUrl(source);
    const varMap = {};

    const promise = new Promise((resolve, reject) => {
        if (!_.isString(source) || !source.length)
            throw new Error('Invalid source');

        if (variablesUrl && !_isUrl(variablesUrl))
            throw new Error('Invalid variables URL');

        resolve(variablesUrl);
    });

    return promise
        .then(_downloadVariables)
        .then((vars) => _assignVariables(varMap, vars))
        .then(() => _assignVariables(varMap, variables))
        .then(() => _ensureLocal(isUrl, source))
        .then((local) => _ensureUnpacked(isUrl, local))
        .then((local) => _makeSassOptions(isUrl, local, varMap, options))
        .then((options) => _sassCompile(options));
}
