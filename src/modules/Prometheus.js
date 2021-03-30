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
    let guilds = await this.client.gatewayClient.action('stats', { name: 'cluster' });
    let { body: feeds } = await this.client.api.getAllFeeds();
    if (!guilds.length) return;
    guilds = guilds.reduce((acc, val) => acc += val.guilds, 0);

    await superagent.post(`${this.url}/gauge/set/guilds/${guilds.reduce((a, b) => a + b)}`);
    await superagent.post(`${this.url}/gauge/set/feeds/${feeds.feedCount}`);
  }

};
