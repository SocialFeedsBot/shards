const Command = require('../../structures/Command');
const { stripIndents } = require('common-tags');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: stripIndents`**Manage feeds with our new [web dashboard!](https://socialfeeds.app)**\nRemoves a feed from the server.\n
        \`type\` can consist of either rss, twitch, twitter or youtube.\n
        \`feed url\` must be the RSS URL or the Twitter/Twitch/Reddit/YouTube channel name..
        \`channel\` must be the channel where you want to remove the feed from.`,
      guildOnly: true,
      aliases: ['delfeed', 'del', 'remove'],
      args: [{ type: 'feed', label: 'type' }, { type: 'url' }, { type: 'channel' }],
      permissions: ['manageGuild']
    });
  }

  async run({ args, author, guild, client, reply }) {
    if (!args.channel.permissionsOf(author.id).has('readMessages')) {
      await reply('You are unable to see this channel.', { success: false });
      return;
    }

    const webhook = (await args.channel.getWebhooks()).find(hook => hook.user.id === client.user.id);
    const { success, message, body } = await client.api.deleteFeed(guild.id, {
      url: args.url,
      type: args.type,
      webhookID: webhook.id
    });

    if (!success) {
      await reply(`An error occurred, please try again later or report this error to our support server.\n${message}`, { success: false });
      return;
    }

    if (body.display) {
      await reply.withEmbed(`Successfully removed feed from \`#${args.channel.name}\`!`, { success: true })
        .setAuthor(body.display.title, body.display.icon)
        .send();
    } else {
      await reply.withEmbed(`Successfully removed feed from \`#${args.channel.name}\`!`, { success: true })
        .setTitle(`${this.humanise(body.type)}: ${body.url}`)
        .send();
    }
  }

  humanise(key) {
    return {
      reddit: 'Reddit',
      rss: 'RSS',
      twitter: 'Twitter',
      twitch: 'Twitch',
      youtube: 'YouTube',
      statuspage: 'Status Page'
    }[key];
  }

};
