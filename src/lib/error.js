import _ from 'lodash';
import bunyan from 'bunyan';
import ExtendableError from 'es6-error';

export
class PaintError extends ExtendableError {
    constructor(message) {
        super(message);
    }

    toString() {
        return `[${this.name}] ${this.message}`;
    }

    getSeverity() {
        return this.severity || bunyan.FATAL;
    }
}

export
class ApplicationError extends PaintError {
    constructor(message = 'Application error') {
        super(message);
        this.severity = bunyan.FATAL;
    }
}

export
class PaintHttpError extends PaintError {
    constructor(
        code = 500,
        message = 'Internal Server Error',
        severity = bunyan.INFO
    ) {
        super(message);
        this.severity = severity;
        this.code = code;
    }
}

export
class InvalidParameterError extends PaintHttpError {
    constructor(params = [], message = 'Invalid paramaters') {
        params = params ? params instanceof Array ? params : [ params ] : [];
        message += (params.length ? ': ' : '') + params.join(', ');
        super(400, message);
    }
}

export
class InvalidVariablesError extends PaintHttpError {
    constructor(vars = null, message = 'Invalid SASS variables', severity) {
        let varMessage = '';

        if (_.isPlainObject(vars)) {
            varMessage = ': ' + JSON.stringify(vars);
        } else if (_.isString(vars)) {
            varMessage = ': ' + vars;
        }

        message += varMessage;
        super(400, message, severity);
    }
}

export
class ResourceError extends PaintHttpError {
    constructor(
        resource = null,
        reason = null,
        message = 'Error requesting resource'
    ) {
        if (resource)
            message += ` [${resource}]`;

        if (reason)
            message += ` - ${reason}`;

        super(400, message);
    }
}

export
class InvalidSassError extends PaintHttpError {
    constructor(message) {
        super(400, message);
    }
}
