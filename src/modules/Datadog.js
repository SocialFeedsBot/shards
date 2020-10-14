// Datadog Module
const metrics = require('datadog-metrics');

module.exports = class DatadogManager {

  /**
   * Create the datadog module.
   * @param client {any} Main client.
   * @param use {boolean} Whether to use the module.
   * @param key {string} Datadog key to use.
   * @param prefix {string} Datadog prefix to use.
   */
  constructor(client, { use, key, prefix }) {
    this.client = client;
    this.use = use;

    if (use) {
      metrics.init({ prefix, apiKey: key });
      setInterval(() => this.updateStats(), 60 * 1000);
    }
  }

  /**
   * Increment method on datadog.
   * @param d Data to send to increment.
   */
  increment(...d) {
    if (!this.use) return;
    metrics.increment(...d);
  }

  /**
   * Gauge method on datadog.
   * @param d Data to send to gauge.
   */
  gauge(...d) {
    if (!this.use) return;
    metrics.gauge(...d);
  }

  /**
   * Update statistics.
   */
  async updateStats() {
    let guilds = await this.client.gatewayClient.request({ t: 'cluster', id: 'all' }, 'this.guilds.size');
    let { body: feeds } = await this.client.api.getAllFeeds();
    if (!guilds.length) return;

    this.gauge('guilds', guilds.reduce((a, b) => a + b));
    this.gauge('feeds', feeds.length);
    this.gauge('memory', process.memoryUsage().heapUsed);
  }

};
