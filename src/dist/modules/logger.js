import chalk from "chalk";
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};
class Logger {
    level;
    constructor() {
        const logLevel = process.env.LOG_LEVEL?.toLowerCase() || "info";
        this.level = LOG_LEVELS[logLevel] ?? LOG_LEVELS.info;
    }
    log(level, message, ...args) {
        if (LOG_LEVELS[level] >= this.level) {
            const timestamp = chalk.cyan(`[${new Date().toISOString().substr(11, 8)}]`);
            let formattedMessage;
            switch (level) {
                case "debug":
                    formattedMessage = `${timestamp} ${chalk.magenta("[DEBUG]")} ${message}`;
                    break;
                case "info":
                    formattedMessage = `${timestamp} ${chalk.blue("[INFO]")} ${message}`;
                    break;
                case "warn":
                    formattedMessage = `${timestamp} ${chalk.yellow("[WARN]")} ${message}`;
                    break;
                case "error":
                    formattedMessage = `${timestamp} ${chalk.red("[ERROR]")} ${message}`;
                    break;
                case "fatal":
                    formattedMessage = `${timestamp} ${chalk.bgRed.bold("[FATAL]")} ${message}`;
                    break;
                default:
                    formattedMessage = `${timestamp} ${message}`;
            }
            // Use console.error for all logs to ensure visibility through server transport
            if (args.length > 0) {
                console.error(formattedMessage, ...args);
            }
            else {
                console.error(formattedMessage);
            }
        }
    }
    debug(message, ...args) {
        this.log("debug", message, ...args);
    }
    info(message, ...args) {
        this.log("info", message, ...args);
    }
    warn(message, ...args) {
        this.log("warn", message, ...args);
    }
    error(message, ...args) {
        this.log("error", message, ...args);
    }
    fatal(message, ...args) {
        this.log("fatal", message, ...args);
    }
}
export const logger = new Logger();
