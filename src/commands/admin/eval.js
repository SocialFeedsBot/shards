const Command = require('../../structures/Command');
const superagent = require('superagent');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      args: [{ type: 'text' }], hidden: true
    });
  }

  async run(ctx) {
    // eslint-disable-next-line no-unused-vars
    const { message, reply, args, channel, guild, author, member, client } = ctx;
    // eslint-disable-next-line no-unused-vars
    const { get, post } = superagent;
    try {
      const result = await eval(args.text);
      reply(`Success.\`\`\`js\n${require('util').inspect(result, { depth: 0 })}\n\`\`\``);
    } catch(err) {
      reply(`Error.\`\`\`js\n${err.stack}\n\`\`\``);
    }
  }

};
