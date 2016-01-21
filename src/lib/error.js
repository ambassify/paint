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
        super(400, message);
        this.params = params ?
            params instanceof Array ?
            params :
            [ params ] :
            [];
    }

    toString() {
        return super.toString() + (this.params.length ? ': ' : '') +
            this.params.join(', ');
    }
}

export
class InvalidVariablesError extends PaintHttpError {
    constructor(vars = null, message = 'Invalid SASS variables') {
        super(400, message);
        this.vars = vars;
    }

    toString() {
        let varMessage = '';

        if (_.isPlainObject(this.vars)) {
            varMessage = ': ' + JSON.stringify(this.vars);
        } else if (_.isString(this.vars)) {
            varMessage = ' ' + this.vars;
        }

        return super.toString() + varMessage;
    }
}

export
class ResourceError extends PaintHttpError {
    constructor(
        resource = null,
        reason = null,
        message = 'Error requesting resource'
    ) {
        super(400, message);
        this.resource = resource;
        this.reason = reason;
    }

    toString() {
        let message = '';

        if (this.resource)
            message += ` [${this.resource}]`;

        if (this.reason)
            message += ` - ${this.reason}`;

        return super.toString() + message;
    }
}

export
class InvalidSassError extends PaintHttpError {
    constructor(message) {
        super(400, message);
    }
}
