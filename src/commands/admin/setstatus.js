const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      args: [{ type: 'text', label: 'msg', optional: false }], hidden: true
    });
  }

  async run({ reply, author, client, args: { msg } }) {
    const [head, body, status] = msg.split(' | ');
    client.api.setStatus({ head, body, status }).then(({ body: res }) => {
      reply(`\`\`\`js\n${require('util').inspect(res)}\n\`\`\``);
    }).catch(e => {
      reply(`__**Error**__\`\`\`js\n${e.stack}\n\`\`\``);
    });
  }

};
