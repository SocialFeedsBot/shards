module.exports = class LoggerExtension {

  constructor(baseLogger, name) {
    this.baseLogger = baseLogger;
    this.name = name;
  }

  info(text) {
    return this.baseLogger.log(this.name, 'info', text);
  }

  warn(text) {
    return this.baseLogger.log(this.name, 'warn', text);
  }

  debug(text) {
    return this.baseLogger.log(this.name, 'debug', text);
  }

  error(text) {
    return this.baseLogger.log(this.name, 'error', text.stack ? text.stack : text);
  }

  getExtension(name) {
    return this.baseLogger.getExtension(name);
  }
};
