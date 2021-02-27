// Prometheus Module
const promCli = require('prom-client');

module.exports = class PrometheusManager {

  constructor(client, use) {
    this.client = client;
    this.use = use;

    if (use) {
      setInterval(() => this.updateStats(), 60 * 1000);

      this.guildCount = new promCli.Gauge({ name: 'guild_count', help: 'amount of guilds' });
      this.feedCount = new promCli.Gauge({ name: 'feed_count', help: 'amount of feeds' });
      this.shardDisconnect = new promCli.Counter({ name: 'shard_disconnect', help: 'amount of shard disconnects' });
      this.shardResume = new promCli.Counter({ name: 'shard_resume', help: 'amount of shard resumes' });
    }
  }

  increment(stat, val = 1) {
    if (this.use && this[stat]) {
      this[stat].inc(val);
    }
  }

  /**
   * Update statistics.
   */
  async updateStats() {
    let guilds = await this.client.gatewayClient.request({ name: 'cluster', id: 'all' }, 'this.guilds.size');
    let { body: feeds } = await this.client.api.getAllFeeds();
    if (!guilds.length) return;

    this.guildCount.set(guilds.reduce((a, b) => a + b));
    this.feedCount.set(feeds.feedCount);
  }

};
