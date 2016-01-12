'use strict';

import sass from 'node-sass';
import _ from 'lodash';

const SASS_OPTIONS = {
    outputStyle: 'compressed'
};

function _isUrl (url) {
    return /^http/.test(url);
}

function _downloadVariables (url) {
    if (!url)
        return {};

    return new Promise(function (resolve, reject) {
        // download and decode vars
        resolve({ some: 'var' });
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

    return new Promise(function (resolve, reject) {
        // download file
        resolve(source);
    });
}

function _ensureUnpacked (isFile, source) {
    if (!isFile)
        return source;

    return new Promise(function (resolve, reject) {
        // extract file
        resolve(source);
    });
}

function _makeSassOptions (isUrl, source, vars, baseOptions) {
    const options = {
        outputStyle: 'compressed',
        data: '$green: #F00; .gert { background: $green; }'
    };

    return options;
}

function _compileSass (options) {
    return new Promise((resolve, reject) => {
        sass.render(options, (err, res) => {
            if (err)
                reject(err);
            else
                resolve(res.css);
        });
    });
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
        .then((sassOptions) => _compileSass(sassOptions));
}
