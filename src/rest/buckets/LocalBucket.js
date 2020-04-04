module.exports = class LocalBucket {

  constructor(ratelimiter) {
    this.functionQueue = [];
    this.limit = 5;
    this.remaining = 1;
    this.reset = 5000;
    this.resetTimeout = null;
    this.ratelimiter = ratelimiter;
  }

  queue(func) {
    return new Promise((resolve, reject) => {
      const wrapFn = () => {
        if (typeof func.then === 'function') {
          return func(this).then(resolve).catch(reject);
        }
        return resolve(func(this));
      };
      this.functionQueue.push({ func, callback: wrapFn });
      this.checkQueue();
    });
  }

  checkQueue() {
    if (this.ratelimiter.global) {
      this.resetTimeout = setTimeout(() => this.resetRemaining(), this.ratelimiter.globalReset);
      return;
    }
    if (this.remaining === 0) {
      this.resetTimeout = setTimeout(() => this.resetRemaining(), this.reset);
      return;
    }
    if (this.functionQueue.length > 0 && this.remaining !== 0) {
      const queuedFunc = this.functionQueue.splice(0, 1)[0];
      queuedFunc.callback();
    }
  }

  resetRemaining() {
    this.remaining = this.limit;
    if (this.resetTimeout) clearTimeout(this.resetTimeout);
    this.checkQueue();
  }

  dropQueue() {
    this.functionQueue = [];
  }

};
