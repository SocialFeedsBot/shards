const LoggerExtension = require('./LoggerExtension');

function getDateString() {
  const d = new Date();

  const hours = `0${d.getHours()}`.slice(-2);
  const minutes = `0${d.getMinutes()}`.slice(-2);
  const seconds = `0${d.getSeconds()}`.slice(-2);

  return `${hours}:${minutes}:${seconds}`;
}

module.exports = class Logger {

  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.extensions = {};
    this.history = [];
  }

  addToHistory(text) {
    this.history.push(text);
    while (this.history.join('\n').length > 2000) {
      this.history = this.history.splice(1);
    }
  }

  getLog() {
    return this.history.join('\n');
  }

  replaceSensitive(string) {
    const sensitive = this.options.sensitive || [];

    for (const text of sensitive) {
      string = string.replace(new RegExp(text, 'gi'), '[CENSORED]');
    }

    return string;
  }

  log(name, type, text) {
    text = this.replaceSensitive(text);
    const dateString = getDateString();
    const string = `${dateString} [${name}:${type.toUpperCase()}] ${text}`;

    this.addToHistory(string);

    console.log(string);

    return string;
  }

  info(text) {
    return this.log(this.name, 'info', text);
  }

  warn(text) {
    return this.log(this.name, 'warn', text);
  }

  debug(text) {
    return this.log(this.name, 'debug', text);
  }

  error(text) {
    return this.log(this.name, 'error', text.stack ? text.stack : text);
  }

  getExtension(name) {
    if (!this.extensions[name]) {
      this.extensions[name] = new LoggerExtension(this, name);
    }

    return this.extensions[name];
  }
};
