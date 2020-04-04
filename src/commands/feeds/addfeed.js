const Command = require('../../structures/Command');
const superagent = require('superagent');
const { stripIndents } = require('common-tags');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: stripIndents`Adds a new feed for the server.\n
        \`type\` can consist of either rss, reddit, twitch, twitter or youtube.\n
        \`feed url\` must be the RSS URL or the Twitter/Twitch/Reddit/YouTube channel name.\n
        \`channel\` must be the channel where you want the feed. The channel can always be changed by setting the channel of the webhook the bot creates.`,
      aliases: ['add'],
      args: [{ type: 'feed', label: 'type' }, { type: 'text', label: 'feed url' }, { type: 'channel' }],
      permissions: ['manageGuild'],
      botPermissions: ['manageWebhooks'],
      guildOnly: true
    });
  }

  async run(context) {
    if (!(await context.args[2].permissionsOf(context.worker.state, context.guild, context.member)).has('readMessages')) {
      await context.rest.createMessage(context.channel.id, `:grey_exclamation: **You cannot see that channel** therefore you cannot setup feeds for it.`);
      return;
    }

    if (context.args[1].includes('reddit') && context.args[0] !== 'reddit') {
      await context.rest.createMessage(context.channel.id, `:information_source: Please use the **reddit** type instead of **${context.args[0]}** for subreddits.`);
      return;
    }

    const webhook = await this.createWebhook(context.worker, context.args[2].id);

    const { success, message } = await context.worker.api.createNewFeed(context.guild.id, {
      feed: { url: context.args[1], type: context.args[0] },
      webhook: { id: webhook.id, token: webhook.token }
    });

    if (!success) {
      await context.rest.createMessage(context.channel.id, `:warning: **Unexpected error,** please try again later. **[${message}]**`);
      return;
    }

    await context.rest.createMessage(context.channel.id, `:white_check_mark: **Feed created,** it will be posted in <#${context.args[2].id}>.`);
  }

  async createWebhook(worker, channelID) {
    const { selfID } = await worker.state.users.get('self');
    const webhooks = await worker.rest.getChannelWebhooks(channelID);
    if (webhooks.length) {
      const webhook = webhooks.find(hook => hook.user.id === selfID);
      if (webhook) {
        return webhook;
      }
    }

    const user = await worker.state.users.get('self');
    const { body } = await superagent.get(`https://cdn.discordapp.com/avatars/${user.selfID}/${user.avatar}.png`)
      .catch(err => console.error(err));
    const avatar = `data:image/png;base64,${body.toString('base64')}`;

    return worker.rest.createChannelWebhook(channelID, {
      name: 'DiscordFeeds',
      avatar: avatar
    });
  }


};
