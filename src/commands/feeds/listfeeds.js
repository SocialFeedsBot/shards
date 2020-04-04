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

  async run(context) {
    const { success, message, body: feeds } = await context.worker.api.getGuildFeeds(context.guild.id);

    if (!success) {
      await context.rest.createMessage(context.channel.id, `:warning: **Unexpected error,** please try again later. **[${message}]**`);
      return;
    }

    if (!feeds.length) {
      await context.rest.createMessage(context.channel.id, ':grey_exclamation: **No feeds have been setup** for this server.');
    } else {
      let msg = '';

      let chunks = [];
      while (feeds.length > 0) chunks.push(feeds.splice(0, 5));
      let page = Math.min(Math.max(parseInt(context.args[0] || 1), 1), chunks.length) || 1;

      const webhooks = [...new Set(chunks[page - 1].map(feed => feed.webhook.token))];

      const final = await Promise.all(webhooks.map(async (webhookToken) => {
        const feed = chunks[page - 1].find(f => f.webhook.token === webhookToken);
        let info;
        try {
          info = await context.rest.getWebhook(feed.webhook.id, feed.webhook.token);
        } catch(e) {
          return null;
        }
        return chunks[page - 1]
          .filter(f => f.webhook.id === feed.webhook.id)
          .map(f => {
            f.channelID = info.channel_id;
            return f;
          });
      }));

      final.filter(f => f).map(async (feed, i) => {
        msg = msg += `\n**Channel <#${feed[0].channelID}>**\n${feed.map(f => this.feedType(f)).join('\n\t')}`;
        // fields.push({ name: `#${guild.channels.get(feed[0].channelID).name}`, value: feed.map(f => this.feedType(f)).join('\n') });
      });

      await context.rest.createMessage(context.channel.id, `__**Feed List**__\n${msg}`);
    }
  }

  feedType(feed) {
    return {
      youtube: `<:youtube:644633161464020993> <https://youtube.com/${feed.url}>`,
      twitch: `<:twitch:644633161401368577> <https://twitch.tv/${feed.url}>`,
      twitter: `<:twitter:644633161212624946> <https://twitter.com/${feed.url}>`,
      rss: `<:rss:644633161933914122> <(${feed.url}>`,
      reddit: `<:reddit:648124175378284544> <https://reddit.com/r/${feed.url}>`
    }[feed.type];
  }

};
