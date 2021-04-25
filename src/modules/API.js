const superagent = require('superagent');
const jwt = require('jsonwebtoken');

module.exports = class APIModule {

  constructor({ url, secret }) {
    this._apiURL = url;
    this._auth = jwt.sign({ id: '', bot: true }, secret, { algorithm: 'HS256' });
  }

  getAllFeeds(query = {}) {
    return this.request('get', 'feeds', undefined, query);
  }

  getGuildFeeds(guildID, query = {}) {
    return this.request('get', `feeds/${guildID}`, undefined, query);
  }

  createNewFeed(guildID, data) {
    return this.request('post', 'feeds', { guildID, ...data });
  }

  deleteFeed(guildID, data) {
    return this.request('delete', 'feeds', { ...data, guildID });
  }

  setStatus(body) {
    return this.request('patch', 'status/messages', body);
  }

  request(method, path, data, query) {
    return new Promise(resolve => {
      superagent[method](`${this._apiURL}/${path}`)
        .set('Authorization', this._auth)
        .query(query)
        .send(data)
        .then(result => {
          resolve({ success: true, body: result.body });
        })
        .catch(err => {
          if (err.message.includes('ECONNREFUSED')) {
            err.message = 'API Offline';
          } else if (err.response) {
            err.message = err.response.body.error;
          }
          resolve({ success: false, message: err.message });
        });
    });
  }

};
