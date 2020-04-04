const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Shhh.',
      args: [{ type: 'text' }]
    });
  }

  async run(context) {
    try {
      const result = await eval(context.args[0]);
      context.rest.createMessage(context.channel.id, `Success.\`\`\`js\n${require('util').inspect(result, { depth: 0 })}\n\`\`\``);
    } catch(err) {
      context.rest.createMessage(context.channel.id, `Error.\`\`\`js\n${err.stack}\n\`\`\``);
    }

  }

};
