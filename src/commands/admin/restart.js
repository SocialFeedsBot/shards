const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      args: [{ type: 'text', label: 'target', optional: false }, { type: 'text', label: 'id', optional: true }], hidden: true
    });
  }

  async run({ reply, author, client, args: { target, id } }) {
    await reply(`Restarting services with type **${target}** (ids: \`${id ? id.split(',').join('` `') : 'all'}\`)`);
    client.gatewayClient.action('restart', { name: target, id: id ? (id === 'all' ? id : id.split(',')) : undefined }, { restarter: author.id, panel: false });
  }

};
