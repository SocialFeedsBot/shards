const Command = require('../../structures/Command');
const { stripIndents } = require('common-tags');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: stripIndents`Adds a new feed for the server.\n
        \`type\` can consist of either rss, reddit, twitch, twitter or youtube.\n
        \`feed url\` must be the RSS URL or the Twitter/Twitch/Reddit/YouTube channel name.\n
        \`channel\` must be the channel where you want the feed. The channel can always be changed by setting the channel of the webhook the bot creates.
        
        **Flags:**
        \`--include-replies\` this option is to include replies in the Twitter feed.`,
      guildOnly: true,
      aliases: ['add'],
      args: [{ type: 'feed', label: 'type' }, { type: 'url' }, { type: 'channel' }, { type: 'text', label: 'flags', optional: true }],
      permissions: ['manageGuild']
    });
  }

  async run({ args, author, channel, guild, reply, client }) {
    if (!args.channel.permissionsOf(author.id).has('readMessages')) {
      await reply('You are unable to see this channel.', { success: false });
      return;
    }

    if (args.url.includes('reddit') && args.type !== 'reddit') {
      await reply(`Please use the **reddit** type instead of **${args.type}**`, { success: false });
      return;
    }

    const includeReplies = (args.flags || '').toLowerCase().includes('--include-replies');
    if (args.type === 'twitter') args.url = args.url.toLowerCase();

    const { success, message } = await client.api.createNewFeed(guild.id, {
      url: args.url,
      type: args.type,
      channelID: args.channel.id,
      nsfw: channel.nsfw,
      options: { replies: includeReplies }
    });

    if (!success) {
      await reply(`An error occurred, please try again later or report this error to our support server.\n${message}`, { success: false });
      return;
    }

    await reply(`Feed created, it will be posted in ${args.channel.mention}.`, { success: true });
  }

};
