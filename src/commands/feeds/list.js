const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Lists the feeds that have been setup in this server. To setup a feed, run the `addfeed` command.',
      guildOnly: true,
      aliases: ['listfeeds'],
      args: [{ type: 'channel' }, { type: 'int', label: 'page', optional: true }]
    });
  }

  async run({ guild, reply, client, args: { channel, page: pageNum } }) {
    const { success, docs } = await this.getFeeds(client, guild.id);
    if (!success) {
      await reply(`Please ensure I have permissions to **Manage Webhooks**. If everything seems okay, please visit my support server or wait a few moments.\nhttps://discord.gg/pKtCuVv`, { success: false });
      return;
    }

    if (!docs.length) {
      await reply('No feeds have been setup for this server.', { success: false });
    } else {
      // Put the feeds into an array by channel ID.
      let feeds = [];
      docs.filter(doc => doc.channelID === channel.id).forEach((doc) => {
        feeds.push(doc);
      });

      // Paginate
      let chunks = [];
      while (feeds.length > 0) chunks.push(feeds.splice(0, 5));
      let page = Math.min(Math.max(parseInt(pageNum || 1), 1), chunks.length) || 1;

      // Embed
      const embed = reply.withEmbed()
        .setColour('orange')
        .setTitle(`Feed list for #${channel.name}`)
        .setFooter(`Page ${page}/${chunks.length}`)
        .setDescription('**:information_source: You can now manage your feeds on an online dashboard!** [Click here to go.](https://socialfeeds.app)\n\n');

      // Populate fields
      chunks[page - 1].forEach((doc) => {
        embed.description += `\n${this.feedType(doc)} ${doc.type === 'twitter' ? `[${doc.options.replies ? 'with replies' : 'without replies'}]` : ''}`;
      });

      // Send the embed
      embed.send();
    }
  }

  feedType(feed) {
    return {
      youtube: `<:youtube:644633161464020993> [${feed.url}](https://youtube.com/channel/${feed.url})`,
      twitch: `<:twitch:644633161401368577> [${feed.url}](https://twitch.tv/${feed.url})`,
      twitter: `<:twitter:644633161212624946> [${feed.url}](https://twitter.com/${feed.url})`,
      rss: `<:rss:644633161933914122> [${feed.url}](${feed.url})`,
      reddit: `<:reddit:648124175378284544> [${feed.url}](https://reddit.com/r/${feed.url})`,
      statuspage: `<:statuspage:809109311271600138> [Status Page: ${feed.url}](${feed.url})`
    }[feed.type];
  }

  async getFeeds(client, guildID) {
    let docs = [];
    let page = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { body: body, message, success: success } = await client.api.getGuildFeeds(guildID, { page });
      if (!success) return { success, message, docs };
      docs.push(...body.feeds);
      page++;
      if (body.page >= body.pages) return { success, message, docs };
    }
  }

};
