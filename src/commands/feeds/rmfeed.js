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
      aliases: ['rm'],
      args: [{ type: 'feed', label: 'type' }, { type: 'text', label: 'feed url' }, { type: 'channel' }],
      permissions: ['manageGuild']
    });
  }

  async run(context) {
    if (!(await context.args[2].permissionsOf(context.worker.state, context.guild, context.member)).has('readMessages')) {
      await context.rest.createMessage(context.channel.id, `:grey_exclamation: **You cannot see that channel** therefore you cannot setup feeds for it.`);
      return;
    }

    const { selfID } = await context.worker.state.users.get('self');
    const webhook = (await context.rest.getChannelWebhooks(context.args[2].id)).find(hook => hook.user.id === selfID);

    const { success, message } = await context.worker.api.deleteFeed(context.guild.id, {
      feed: { url: context.args[1], type: context.args[0] },
      webhook: { id: webhook.id, token: webhook.token }
    });

    if (!success) {
      await context.rest.createMessage(context.channel.id, `:warning: **Unexpected error,** please try again later. **[${message}]**`);
      return;
    }

    await context.rest.createMessage(context.channel.id, `:white_check_mark: **Feed deleted,** it will no longer be posted in <#${context.args[2].id}>.`);
  }

};
