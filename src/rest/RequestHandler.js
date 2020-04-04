const axios = require('axios');
const FormData = require('form-data');

const Endpoints = require('./Endpoints');
const { version } = require('../../package');

module.exports = class RequestHandler {

  constructor(ratelimiter, token) {
    this.ratelimiter = ratelimiter;
    this.options = { baseHost: Endpoints.BASE_HOST, baseURL: Endpoints.BASE_URL };

    this.client = axios.create({
      baseURL: this.options.baseHost + Endpoints.BASE_URL,
      headers: {
        Authorization: token,
        'User-Agent': `DiscordFeeds (https://discordfeeds.com, ${version})`
      }
    });

    this.latency = 500;
    this.remaining = {};
    this.reset = {};
    this.limit = {};
  }

  request(endpoint, method, dataType = 'json', data = {}, attempts = 0) {
    return new Promise((res, rej) => {
      this.ratelimiter.queue(async (bkt) => {
        let request;
        const latency = Date.now();
        try {
          switch (dataType) {
            case 'json':
              request = await this._request(endpoint, method, data, (method === 'get' || endpoint.includes('/bans') || endpoint.includes('/prune')));
              break;
            case 'multipart':
              request = await this._multiPartRequest(endpoint, method, data);
              break;
            default:
              break;
          }
          this.latency = Date.now() - latency;
          const offsetDate = this._getOffsetDateFromHeader(request.headers.date);
          this._applyRatelimitHeaders(bkt, request.headers, offsetDate, endpoint.endsWith('/reactions/:id'));
          if (request.data) {
            return res(request.data);
          }
          return res();
        } catch (error) {
          if (attempts === 3) {
            return rej({ error: 'Request failed after 3 attempts', request: error });
          }
          if (error.response) {
            const offsetDate = this._getOffsetDateFromHeader(error.response.headers.date);
            if (error.response.status === 429) {
              this._applyRatelimitHeaders(bkt, error.response.headers, offsetDate, endpoint.endsWith('/reactions/:id'));
              return this.request(endpoint, method, dataType, data, attempts ? ++attempts : 1);
            }
            if (error.response.status === 502) {
              return this.request(endpoint, method, dataType, data, attempts ? ++attempts : 1);
            }
          }
          return rej(error);
        }
      }, endpoint, method);
    });

  }

  _getOffsetDateFromHeader(dateHeader) {
    const discordDate = Date.parse(dateHeader);
    const offset = Date.now() - discordDate;
    return Date.now() + offset;
  }

  _applyRatelimitHeaders(bkt, headers, offsetDate, reactions = false) {
    if (headers['x-ratelimit-global']) {
      bkt.ratelimiter.global = true;
      bkt.ratelimiter.globalReset = parseInt(headers.retry_after);
    }

    if (headers['x-ratelimit-reset']) {
      const reset = (headers['x-ratelimit-reset'] * 1000) - offsetDate;
      if (reactions) {
        bkt.reset = Math.max(reset, 250);
      } else {
        bkt.reset = reset;
      }
    }

    if (headers['x-ratelimit-remaining']) {
      bkt.remaining = parseInt(headers['x-ratelimit-remaining']);
    } else {
      bkt.remaining = 1;
    }

    if (headers['x-ratelimit-limit']) {
      bkt.limit = parseInt(headers['x-ratelimit-limit']);
    }
  }

  async _request(endpoint, method, data, useParams = false) {
    const headers = {};
    if (data.reason) {
      headers['X-Audit-Log-Reason'] = data.reason;
      delete data.reason;
    }
    if (useParams) {
      return this.client(endpoint, { method, params: data, headers });
    } else {
      return this.client(endpoint, { method, data, headers });
    }
  }

  async _multiPartRequest(endpoint, method, data) {
    const formData = new FormData();
    if (data.file.file) {
      if (data.file.name) {
        formData.append('file', data.file.file, { filename: data.file.name });
      } else {
        formData.append('file', data.file.file);
      }

      delete data.file.file;
    }
    formData.append('payload_json', JSON.stringify(data));

    return this.client(endpoint, {
      method,
      data: formData,
      headers: { 'Content-Type': `multipart/form-data` }
    });
  }

};
