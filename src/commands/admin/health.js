const Command = require('../../structures/Command');
const moment = require('moment');
require('moment-duration-format');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      hidden: true
    });
  }

  async run({ client, reply }) {
    const api = await client.gatewayClient.request(
      { name: 'api' },
      '({ uptime: process.uptime() * 1000, memory: process.memoryUsage().heapUsed })'
    );
    const feeds = await client.gatewayClient.request(
      { name: 'feeds' },
      '({ uptime: process.uptime() * 1000, memory: process.memoryUsage().heapUsed })'
    );
    const clusters = await client.gatewayClient.request(
      { name: 'cluster', id: 'all' },
      '({ id: this.clusterID, uptime: process.uptime() * 1000, memory: process.memoryUsage().heapUsed })'
    );

    const embed = reply.withEmbed().setColour('orange').setTitle('Service Health');
    let downServices = [];

    if (api[0]) {
      embed.addField(
        'api',
        `Uptime: ${moment.duration(api[0].uptime).format('D[d] H[ h] m[ m] s[ s]')}\nMemory: ${this.memory(api[0].memory)}`,
        true
      );
    } else {
      downServices.push('api');
    }

    if (feeds[0]) {
      embed.addField(
        'feed-handler',
        `Uptime: ${moment.duration(feeds[0].uptime).format('D[d] H[ h] m[ m] s[ s]')}\nMemory: ${this.memory(feeds[0].memory)}`,
        true
      );
    } else {
      downServices.push('feed-handler');
    }

    clusters.forEach(cluster => {
      embed.addField(
        `cluster-${cluster.id}`,
        `Uptime: ${moment.duration(cluster.uptime).format('D[d] H[ h] m[ m] s[ s]')}\nMemory: ${this.memory(cluster.memory)}`,
        true
      );
    });

    if (downServices.length > 0) {
      embed.setDescription(`${downServices.length} service(s) down: ${downServices.join(', ')}`);
    }
    embed.send();
  }

  memory(bytes) {
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    let by = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (by === 0) return `${bytes} ${sizes[by]}`;
    return `${(bytes / Math.pow(1024, by)).toFixed(1)} ${sizes[by]}`;
  }

};
