const { createLogger, format, transports } = require('winston');

exports.getLogger = function (serviceName) {
    const logLevel = process.env.LOG_LEVEL || "warn";
    const logsDir = process.env.LOGS_DIR || "logs";

    const logger = createLogger({
        level: logLevel,
        format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.errors({ stack: true }),
            format.splat(),
            format.json()
        ),
        defaultMeta: { service: serviceName }
    });

    if (process.env.NODE_ENV === 'production') {
        console.log(process.env.NODE_ENV)
        logger.add.transports = [
            //
            // - Write to all logs with level `info` and below to `combined.log`
            // - Write all logs error (and below) to `error.log`.
            //
            new transports.File({ dirname: logsDir, filename: serviceName + '-error.log', level: 'error' }),
            new transports.File({ dirname: logsDir, filename: serviceName + '-debug.log', level: 'debug' }),
            new transports.File({ dirname: logsDir, filename: serviceName + '.log' })
        ]
    } else {
        logger.add(new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        }));
    }

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        }));
      }
    return logger;
}