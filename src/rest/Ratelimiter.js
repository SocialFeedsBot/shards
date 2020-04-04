const LocalBucket = require('./buckets/LocalBucket');

module.exports = class Ratelimiter {

  constructor() {
    this.buckets = {};
    this.global = false;
    this.globalReset = 0;
  }

  routify(url, method) {
    let route = url.replace(/\/([a-z-]+)\/(?:[0-9]{17,19})/g, (match, p) => p === 'channels' || p === 'guilds' || p === 'webhooks' ? match : `/${p}/:id`)
      .replace(/\/reactions\/[^/]+/g, '/reactions/:id')
      .replace(/^\/webhooks\/(\d+)\/[A-Za-z0-9-_]{64,}/, '/webhooks/$1/:token');

    if(method === 'DELETE' && route.endsWith('/messages/:id')) { // Delete Messsage endpoint has its own ratelimit
      route = method + route;
    }

    return route;
  }

  queue(fn, url, method) {
    const routeKey = this.routify(url, method);
    if (!this.buckets[routeKey]) {
      this.buckets[routeKey] = new LocalBucket(this);
    }
    this.buckets[routeKey].queue(fn);
  }

};
