const superagent = require('superagent');
const jwt = require('jsonwebtoken');

module.exports = class APIModule {

  constructor({ url, secret }) {
    this._apiURL = url;
    this._auth = jwt.sign({ id: '', bot: true }, secret, { algorithm: 'HS256' });
  }

  getAllFeeds() {
    return this.request('get', 'feeds');
  }

  getGuildFeeds(guildID) {
    return this.request('get', `feeds/${guildID}`);
  }

  createNewFeed(guildID, data) {
    return this.request('post', 'feeds/new', { guildID, ...data });
  }

  deleteFeed(guildID, data) {
    return this.request('delete', 'feeds/delete', { ...data, guildID });
  }

  request(method, path, data) {
    return new Promise(resolve => {
      superagent[method](`${this._apiURL}/${path}`)
        .set('Authorization', this._auth)
        .send(data)
        .then(result => {
          resolve({ success: true, body: result.body });
        })
        .catch(err => {
          if (err.message.includes('ECONNREFUSED')) {
            err.message = 'API Offline';
          } else {
            err.message = err.response.body.error;
          }
          resolve({ success: false, message: err.message });
        });
    });
  }

};
