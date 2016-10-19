import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import sass from 'node-sass';
import sassGlobbing from 'node-sass-globbing';

import logger from './logger';
import { InvalidSassError } from '../lib/error';

const defaultOptions = {
    outputStyle: 'compressed'
};

const sassGlobbingPrevRe = /^\|prev=([^\|]*?)\|/;

const _getImportProtector = (allowed) => (file, prev) => {
    // This is how node-sass-globbing keeps track of the previous directory
    if(file.indexOf('|prev=') === 0) {
        var matches = file.match(sassGlobbingPrevRe);
        if(matches.length) {
            prev = path.dirname(matches[1]);
            file = file.replace(sassGlobbingPrevRe, '');
        }
    }

    // This is the absolute path that they're trying to import
    const resolved = path.resolve(prev, file);

    try {
        // If we can't get stats, it means the file is not on the OS (does not
        // exist, is an url, ...)
        // We must us sync because async importer does not support returning
        // `sass.types.Null()` to inidicate the importer does not handle this
        // file.
        const stat = fs.statSync(resolved);

        // If it is a file, check if they are allowed to import it
        if (stat.isFile() && (!allowed || resolved.indexOf(allowed) !== 0)) {
            return new InvalidSassError(
                `Attempted to include restricted file: ${file}`
            );
        }
    } catch (e) { }

    // If we get here, the import is allowed, pass along
    // to the next import handler
    return sass.types.Null(); // eslint-disable-line
};

function makeSassVariables (vars) {
    return _.map(vars, (v, k) => {
        return `$${k}: ${v};`;
    }).join('\n');
}

function makeSassImport (location) {
    return `@import "${location}";`;
}

function parseBaseOptions (baseOptions) {
    const options = {};

    if (baseOptions.debug == 1) {
        options.sourceMapEmbed = true;
        options.sourceMapContents = true;
    }

    return options;
}

export default function compile (options) {
    // If we forgot to set importers, we will disable all imports on our FS
    // as a fallback security measure. This could be improved upon, if possible
    // the importer array/func should be scanned for the presence of our import
    // protector
    if (!options.importer)
        options.importer = _getImportProtector(false);

    return new Promise((resolve, reject) => {
        sass.render(options, (err, res) => {
            if (err)
                reject(new InvalidSassError(err.toString()));
            else {
                const css = res.css.toString('utf8');
                res = null; // now it is free by the time we reach global.gc()
                resolve(css);
                global.gc(); // Run GC here such that it does not interfere with the request.
            }
        });
    });
}

export function optionsForDirectory (dir, vars, baseOptions) {
    const file = dir + '/style.scss';

    const options = _.assign(defaultOptions, parseBaseOptions(baseOptions), {
        data: makeSassVariables(vars) + '\n' + makeSassImport(file),
        importer: [ _getImportProtector(dir), sassGlobbing ]
    });

    return options;
}

export function optionsForFile (file, vars, baseOptions) {
    const options = _.assign(defaultOptions, parseBaseOptions(baseOptions), {
        data: makeSassVariables(vars) + '\n' + makeSassImport(file),
        importer: [ _getImportProtector(file), sassGlobbing ]
    });

    return options;
}

export function optionsForData (sassText, vars, baseOptions) {
    const options = _.assign(defaultOptions, parseBaseOptions(baseOptions), {
        data: makeSassVariables(vars) + '\n' + sassText,
        importer: [ _getImportProtector(false), sassGlobbing ]
    });

    return options;
}
