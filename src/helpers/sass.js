import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import sass from 'node-sass';
import sassGlobbing from 'node-sass-globbing';
import PQueue from 'p-queue';

import logger from './logger';
import { InvalidSassError } from '../lib/error';
import { getSassModulePaths } from './environment';

// Queue ensures node-sass does not stall by consuming the entire pool
// https://github.com/sass/node-sass/issues/857
const poolSize = process.env.UV_THREADPOOL_SIZE || 4;
const sassQueue = new PQueue({ concurrency: poolSize - 1 });

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

    return sassQueue.add(() => new Promise((resolve, reject) => {
        sass.render(options, (err, res) => {
            if (err)
                reject(new InvalidSassError(err.toString()));
            else
                resolve(res.css);
        });
    }));
}

function createModuleImporter(root) {
    const modulePaths = getSassModulePaths() || [];
    let paths = undefined;

    if (modulePaths.length)
        paths = modulePaths.map(p => path.resolve(root, p));

    return require('sass-module-importer')({ paths });
}


export function optionsForDirectory (dir, vars, baseOptions) {
    const file = dir + '/style.scss';

    const options = _.assign(defaultOptions, parseBaseOptions(baseOptions), {
        data: makeSassVariables(vars) + '\n' + makeSassImport(file),
        // globbing enabled; import node modules; protect imports (relative to dir)
        importer: [ _getImportProtector(dir), createModuleImporter(dir), sassGlobbing ]
    });

    return options;
}

export function optionsForFile (file, vars, baseOptions) {
    const options = _.assign(defaultOptions, parseBaseOptions(baseOptions), {
        data: makeSassVariables(vars) + '\n' + makeSassImport(file),
        // no imports or globbing allowed (except the file itself)
        importer: [ _getImportProtector(file) ]
    });

    return options;
}

export function optionsForData (sassText, vars, baseOptions) {
    const options = _.assign(defaultOptions, parseBaseOptions(baseOptions), {
        data: makeSassVariables(vars) + '\n' + sassText,
        // no imports or globbing allowed
        importer: [ _getImportProtector(false) ]
    });

    return options;
}
