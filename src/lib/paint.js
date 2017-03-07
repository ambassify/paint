'use strict';

import bunyan from 'bunyan';
import fs from 'fs';
import sass from 'node-sass';
import _ from 'lodash';

import {
    InvalidSassError,
    InvalidParameterError,
    InvalidVariablesError
} from './error';

import logger from '../helpers/logger';
import { download, downloadFile } from '../helpers/download';
import unpack, { canHandle as isArchive } from '../helpers/unarchive';
import { isUrl as _isUrl } from '../helpers/url';
import sassCompile, {
    optionsForFile as sassFileOptions,
    optionsForDirectory as sassDirectoryOptions,
    optionsForData as sassDataOptions
} from '../helpers/sass';
import autoprefix from '../helpers/autoprefixer';

const SASS_OPTIONS = {
    outputStyle: 'compressed'
};

function _downloadVariables (url) {
    if (!url)
        return {};

    logger().info({ context: 'variables' }, 'Downloading variables from %s', url);

    return download(url, true)
        .then((contents) => {
            let variables = contents;

            if (_.isString(contents)) {
                try {
                    variables = JSON.parse(contents);
                } catch (e) { }
            }

            if (!_.isPlainObject(variables)) {
                throw new InvalidVariablesError(
                    contents,
                    `Invalid SASS variables at [${url}]`,
                    bunyan.FATAL
                );
            }

            return variables;
        });
}

function _assignVariables (map, variables = null) {
    if (variables) {
        _.forEach(variables, (v, k) => {
            if (!_.isString(v))
                throw new InvalidVariablesError({ [k]: v });

            map[k] = v;
        });
    }

    return map;
}

function _ensureLocal (isUrl, source) {
    if (!isUrl)
        return source;

    logger().info({ context: 'source' }, 'Downloading source from %s', source);

    return downloadFile(source);
}

function _ensureUnpacked (isFile, source) {
    if (!isFile || !isArchive(source))
        return source;

    logger().info({ context: 'source' }, 'Unpacking downloaded source');

    return unpack(source);
}

function _makeSassOptions (isUrl, source, vars, baseOptions) {
    logger().info({ context: 'sass' }, 'Generating sass variables');

    if (!isUrl)
        return sassDataOptions(source, vars, baseOptions);

    return fs.statSync(source).isDirectory() ?
        sassDirectoryOptions(source, vars, baseOptions) :
        sassFileOptions(source, vars, baseOptions);
}

function _sassCompile (isUrl, source, vars, baseOptions) {
    const options = _makeSassOptions(isUrl, source, vars, baseOptions);

    logger().info({ context: 'sass' }, 'Compiling sass');

    return sassCompile(options);
}

function _resolveSource(source, isUrl) {
    return Promise.resolve()
        .then(() => _ensureLocal(isUrl, source))
        .then((local) => _ensureUnpacked(isUrl, local));
}

function _resolveVariables(url, variables) {
    const varMap = {};

    return Promise.resolve(url)
        .then(_downloadVariables)
        .then((vars) => _assignVariables(varMap, vars))
        .then(() => _assignVariables(varMap, variables))
        .then(() => varMap);
}

export default
function Paint (source, variablesUrl = null, variables = null, options = {}) {
    const isUrl = _isUrl(source);
    const varMap = {};

    const retryNoVars = !!options.retryNoVars;
    delete options.retryNoVars;

    return Promise.all([
        _resolveSource(source, isUrl),
        _resolveVariables(variablesUrl, variables)
    ]).then(([ local, mergedVars ]) => {
        return _sassCompile(isUrl, local, mergedVars, options).catch(e => {
            if (!retryNoVars || !(e instanceof InvalidSassError))
                throw e;

            return _sassCompile(isUrl, local, {}, options);
        });
    }).then(autoprefix);
}
