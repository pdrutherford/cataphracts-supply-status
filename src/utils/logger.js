class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
  }

  shouldLog(level) {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);

    let formattedMessage = `[${timestamp}] ${levelStr} ${message}`;

    if (args.length > 0) {
      // Handle error objects and other complex data
      const formattedArgs = args.map((arg) => {
        if (arg instanceof Error) {
          return `\\n${arg.stack || arg.message}`;
        } else if (typeof arg === "object") {
          return `\\n${JSON.stringify(arg, null, 2)}`;
        }
        return arg;
      });

      formattedMessage += ` ${formattedArgs.join(" ")}`;
    }

    return formattedMessage;
  }

  debug(message, ...args) {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, ...args));
    }
  }

  info(message, ...args) {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, ...args));
    }
  }

  warn(message, ...args) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, ...args));
    }
  }

  error(message, ...args) {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, ...args));
    }
  }
}

const logger = new Logger();

module.exports = { logger, Logger };
