import bunyan from 'bunyan';
import createLogger from '@ambassify/bunyan-logger';

let logger = createLogger({
    name: 'paint',
    level: 'trace'
});

export default function () {
    return logger;
};

export function logForLevel(levelOrName) {
    const level = bunyan.resolveLevel(levelOrName);

    if (!level || !bunyan.nameFromLevel[level])
        return logger.fatal.bind(logger);

    return logger[bunyan.nameFromLevel[level]].bind(logger);
}

export function addLoggerContext(ctx) {
    logger = logger.child(ctx);
}
