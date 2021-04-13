const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: '**Manage feeds with our new [web dashboard!](https://socialfeeds.app)**\nLists the feeds that have been setup in this server. To setup a feed, run the `addfeed` command.',
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
      while (feeds.length > 0) chunks.push(feeds.splice(0, 15));
      let page = Math.min(Math.max(parseInt(pageNum || 1), 1), chunks.length) || 1;

      // Embed
      const embed = reply.withEmbed()
        .setColour(16753451)
        .setTitle(`Feed list for #${channel.name}`)
        .setFooter(`Total feeds: ${docs.length} (15 max shown)`)
        .setDescription('You can now manage your feeds on an online [dashboard](https://socialfeeds.app)\n');

      // Populate fields
      chunks[page - 1].forEach((doc) => {
        embed.description += `\n${this.feedType(doc)} ${doc.type === 'twitter' ? `[${doc.options.replies ? 'with replies' : 'without replies'}]` : ''}`;
      });

      // Send the embed
      embed.send();
    }
  }

  feedType(feed) {
    let display = feed.display ? feed.display.title : feed.url;
    return {
      youtube: `<:youtube:644633161464020993> [${display}](https://youtube.com/channel/${feed.url})`,
      twitch: `<:twitch:644633161401368577> [${display}](https://twitch.tv/${feed.url})`,
      twitter: `<:twitter:644633161212624946> [${display}](https://twitter.com/${feed.url})`,
      rss: `<:rss:644633161933914122> [${display}](${feed.url})`,
      reddit: `<:reddit:648124175378284544> [${display}](https://reddit.com/r/${feed.url})`,
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
