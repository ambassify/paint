import bunyan from 'bunyan';

const logger = bunyan.createLogger({
    name: 'paint',
    level: 'trace'
});

logger.levels(0);

export default logger;
