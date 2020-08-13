const Command = require('../../structures/Command');
const { stripIndents } = require('common-tags');
const superagent = require('superagent');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: stripIndents`Adds a new feed for the server.\n
        \`type\` can consist of either rss, reddit, twitch, twitter or youtube.\n
        \`feed url\` must be the RSS URL or the Twitter/Twitch/Reddit/YouTube channel name.\n
        \`channel\` must be the channel where you want the feed. The channel can always be changed by setting the channel of the webhook the bot creates.`,
      guildOnly: true,
      aliases: ['add'],
      args: [{ type: 'feed', label: 'type' }, { type: 'text', label: 'url' }, { type: 'channel' }],
      permissions: ['manageGuild']
    });
  }

  async run({ args, author, guild, reply, client }) {
    if (!guild.me.permission.has('manageWebhooks')) {
      await reply('I require the `Manage Webhooks` permisison to create webhooks.', { success: false });
      return;
    }

    if (!args.channel.permissionsOf(author.id).has('readMessages')) {
      await reply('You are unable to see this channel.', { success: false });
      return;
    }

    if (args.url.includes('reddit') && args.type !== 'reddit') {
      await reply(`Please use the **reddit** type instead of **${args.type}**`, { success: false });
      return;
    }

    const webhook = await this.createWebhook(client, args.channel.id);
    const { success, message } = await client.api.createNewFeed(guild.id, {
      feed: { url: args.url, type: args.type },
      webhook: { id: webhook.id, token: webhook.token }
    });

    if (!success) {
      await reply(`An error occurred, please try again later or report this error to our support server.\n${message}`, { success: false });
      return;
    }

    await reply(`Feed created, it will be posted in ${args.channel.mention}.`, { success: true });
  }

  async createWebhook(client, channelID) {
    const webhooks = await client.getChannelWebhooks(channelID);
    if (webhooks.length) {
      const webhook = webhooks.find(hook => hook.user.id === client.user.id);
      if (webhook) {
        return webhook;
      }
    }

    const { body } = await superagent.get(client.user.dynamicAvatarURL('png'))
      .catch(err => console.error(err));
    const avatar = `data:image/png;base64,${body.toString('base64')}`;

    return client.createChannelWebhook(channelID, {
      name: 'DiscordFeeds',
      avatar: avatar
    }, 'Create Feed Webhook');
  }

};
