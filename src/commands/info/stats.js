const Command = require('../../structures/Command');
const { stripIndents } = require('common-tags');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'View some potentially useful statistics.',
      args: [{ type: 'text', label: 'command', optional: true }]
    });
  }

  async run({ client, reply, guild }) {
    const stats = {
      guilds: client.guilds.size,
      users: client.users.size,
      ram: process.memoryUsage().heapUsed,
      clusterID: client.clusterID,
      clusterCount: 1,
      shardCount: client.options.maxShards,
      uptime: client.uptime
    };

    const { body: feeds, success } = await client.api.getAllFeeds();
    const { body: thisServer, success: otherSuccess } = guild ? await client.api.getGuildFeeds(guild.id) : { success: false, body: null };

    if (client.gatewayClient.connected) {
      const results = await client.gatewayClient.action('stats', { name: 'cluster' });

      if (!results.length) {
        reply('The gateway encountered an error collecting stats.', { success: false });
        return;
      }

      stats.guilds = results.reduce((acc, val) => acc += val.guilds, 0);
      stats.users = results.reduce((acc, val) => acc += val.users, 0);
      stats.ram = results.reduce((acc, val) => acc += val.memory, 0);
    }

    reply.withEmbed()
      .setColour('orange')
      .setTitle('Statistics')
      .addField('General', stripIndents`:white_small_square: Guilds: ${stats.guilds.toLocaleString()} (${client.guilds.size.toLocaleString()} on cluster)
        :white_small_square: Users: ${stats.users.toLocaleString()}
        :white_small_square: Memory: ${this.convertMem(stats.ram)}`, true)
      .addField('Number of Feeds', stripIndents`:white_small_square: This server: ${otherSuccess ? thisServer.feedCount.toLocaleString() : 'N/A'}
        :white_small_square: Global: ${success ? feeds.feedCount.toLocaleString() : 'N/A'}`, true)
      .setThumbnail(client.user.avatarURL)
      .setFooter(`Cluster ${client.clusterID}/${stats.clusterCount}`)
      .send();
  }

  convertMem(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    const by = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    if (by === 0) return `${bytes} ${sizes[by]}`;
    return `${(bytes / Math.pow(1024, by)).toFixed(1)} ${sizes[by]}`;
  }

};

