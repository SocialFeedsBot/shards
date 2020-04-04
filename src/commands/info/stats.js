const Command = require('../../structures/Command');
const moment = require('moment');

require('moment-duration-format');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Advanced statistics of DiscordFeeds.'
    });
  }

  async run(context) {
    const guilds = await context.worker.state.guilds.count();
    const unavailableGuilds = (await context.worker.state.guilds.getAll()).filter((g) => g.unavailable).length;
    const channels = await context.worker.state.channels.count();

    const { body: feeds, success } = await context.worker.api.getAllFeeds();
    const { body: thisServer, success: otherSuccess } = context.guild ? await context.worker.api.getGuildFeeds(context.guild.id) : { success: false, body: null };

    const user = await context.worker.state.users.get('self');

    context.rest.createMessage(context.channel.id, {
      embed: {
        title: 'Statistics',
        thumbnail: { url: `https://cdn.discordapp.com/avatars/${user.selfID}/${user.avatar}.png` },
        fields: [
          {
            name: 'General',
            value: `:white_small_square: Guilds: ${guilds.toLocaleString()} (${unavailableGuilds} unavailable)\n:white_small_square: Channels: ${channels.toLocaleString()}\n:white_small_square: Worker memory: ${this.convertMem(process.memoryUsage().rss)}`,
            inline: true
          },
          {
            name: 'Feeds',
            value: `:white_small_square: Setup (server): ${otherSuccess ? thisServer.length.toLocaleString() : 'N/A'}\n:white_small_square: Setup (global): ${success ? feeds.length.toLocaleString() : 'N/A'}`,
            inline: true
          },
          { name: 'Uptime', value: moment.duration(context.worker.uptime).format('D[d], H[h], m[m], s[s]'), inline: false }
        ]
      }
    });
  }

  convertMem(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    const by = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    if (by === 0) return `${bytes} ${sizes[by]}`;
    return `${(bytes / Math.pow(1024, by)).toFixed(1)} ${sizes[by]}`;
  }

};
