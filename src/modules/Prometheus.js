// Prometheus Module
const superagent = require('superagent');

module.exports = class PrometheusManager {

  constructor(client, config) {
    this.client = client;
    this.use = config.use;
    this.url = config.url;

    if (this.use) {
      setInterval(() => this.updateStats(), 60 * 1000);
    }
  }

  increment (stat) {
    if (this.use) {
      return superagent.post(`${this.url}/counter/${stat}`);
    }

    return null;
  }

  /**
   * Update statistics.
   */
  async updateStats() {
    let guilds = await this.client.gatewayClient.request({ name: 'cluster', id: 'all' }, 'this.guilds.size');
    let { body: feeds } = await this.client.api.getAllFeeds();
    if (!guilds.length) return;

    await superagent.post(`${this.url}/gauge/guilds/set/${guilds.reduce((a, b) => a + b)}`);
    await superagent.post(`${this.url}/gauge/feeds/set/${feeds.feedCount}`);
  }

};
