const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Lists the feeds that have been setup in this server. To setup a feed, run the `addfeed` command.',
      guildOnly: true,
      aliases: ['list'],
      args: [{ type: 'int', label: 'page', optional: true }]
    });
  }

  async run({ guild, reply, client, args: { page: pageNum } }) {
    const { success, message, body: docs } = await client.api.getGuildFeeds(guild.id);

    if (!success) {
      await reply(`An error occurred, please try again later or report this error to our support server.\n${message}`, { success: false });
      return;
    }

    if (!docs.length) {
      await reply('No feeds have been setup for this server.', { success: false });
    } else {
      // Put the feeds into an array by channel ID.
      let feeds = {};
      docs.forEach((doc) => {
        if (guild.channels.get(doc.channelID)) {
          if (!feeds[doc.channelID]) feeds[doc.channelID] = [];
          feeds[doc.channelID].push({ ...doc, channelName: guild.channels.get(doc.channelID).name });
        }
      });
      feeds = Object.values(feeds);

      // Paginate
      let chunks = [];
      while (feeds.length > 0) chunks.push(feeds.splice(0, 5));
      let page = Math.min(Math.max(parseInt(pageNum || 1), 1), chunks.length) || 1;

      // Embed
      const embed = reply.withEmbed()
        .setColour('orange')
        .setTitle(`Feed List - Page ${page}/${chunks.length}`);

      // Populate fields
      chunks[page - 1].forEach((doc) => embed.addField(
        `#${doc[0].channelName}`,
        doc.map(f => this.feedType(f)).join('\n')
      ));

      // Send the embed
      embed.send();
    }
  }

  feedType(feed) {
    return {
      youtube: `<:youtube:644633161464020993> [${feed.url}](https://youtube.com/${feed.url})`,
      twitch: `<:twitch:644633161401368577> [${feed.url}](https://twitch.tv/${feed.url})`,
      twitter: `<:twitter:644633161212624946> [${feed.url}](https://twitter.com/${feed.url})`,
      rss: `<:rss:644633161933914122> [${feed.url}](${feed.url})`,
      reddit: `<:reddit:648124175378284544> [${feed.url}](https://reddit.com/r/${feed.url})`,
      discordstatus: '<:discord:698945805163429898> <https://discordstatus.com>'
    }[feed.type];
  }

};
