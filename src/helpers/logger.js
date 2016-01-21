import bunyan from 'bunyan';

let logger = bunyan.createLogger({
    name: 'paint',
    level: 'trace',
    serializers: {
        err: bunyan.stdSerializers.err
    }
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
