import _ from 'lodash';
import sass from 'node-sass';

export function makeSassVariables (vars) {
    return _.map(vars, (v, k) => {
        return `$${k}: ${v};`;
    }).join('\n');
}

export function makeSassImport (path) {
    return `@import "${path}";`;
}

export default function compile (options) {
    return new Promise((resolve, reject) => {
        sass.render(options, (err, res) => {
            if (err)
                reject(err);
            else
                resolve(res.css);
        });
    });
}

export function optionsForDirectory (dir, vars, baseOptions) {
    const file = dir + '/style.scss';

    const options = {
        outputStyle: 'compressed',
        data: makeSassVariables(vars) + '\n' + makeSassImport(file)
    };

    return options;
}

export function optionsForFile (file, vars, baseOptions) {
    const options = {
        outputStyle: 'compressed',
        data: makeSassVariables(vars) + '\n' + makeSassImport(file)
    };

    return options;
}

export function optionsForData (sassText, vars, baseOptions) {
    const options = {
        outputStyle: 'compressed',
        data: makeSassVariables(vars) + '\n' + sassText
    };

    return options;
}
