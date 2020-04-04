const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Get worker ID.',
      hidden: true
    });
  }

  run(context) {
    context.rest.createMessage(context.channel.id, `This worker is: ${process.env.NODE_APP_INSTANCE || process.pid}`);
  }

};
