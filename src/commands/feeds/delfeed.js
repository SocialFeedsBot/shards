const Command = require('../../structures/Command');
const { stripIndents } = require('common-tags');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: stripIndents`Removes a feed from the server.\n
        \`type\` can consist of either rss, twitch, twitter or youtube.\n
        \`feed url\` must be the RSS URL or the Twitter/Twitch/Reddit/YouTube channel name..
        \`channel\` must be the channel where you want to remove the feed from.`,
      guildOnly: true,
      aliases: ['rmfeed', 'del', 'rm'],
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
    const { success, message } = await client.api.deleteFeed(guild.id, {
      url: args.url,
      type: args.type,
      webhookID: webhook.id
    });

    if (!success) {
      await reply(`An error occurred, please try again later or report this error to our support server.\n${message}`, { success: false });
      return;
    }

    await reply(`Feed deleted, it will no longer be posted in ${args.channel.mention}.`, { success: true });
  }

};
