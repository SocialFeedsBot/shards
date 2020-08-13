const emotes = require('./emojis');

const EmbedBuilder = require('./EmbedBuilder');

module.exports = (message) => {
  const reply = (content, options = { success: null, noKoala: false, emoji: null }) => {
    let final = content;

    switch (options.success) {
      case true: {
        final = `${emotes.check} ${final}`;
        break;
      }
      case false: {
        final = `${emotes.xmark} ${final}`;
        break;
      }
    }

    if (options.emoji) final = `${emotes[options.emoji]} ${content}`;

    return message.channel.createMessage(final);
  };

  reply.withEmbed = (description, options = { success: null, emoji: null }) => {
    const embed = new EmbedBuilder(message.channel);

    switch (options.success) {
      case true: {
        description = description ? `${emotes.check} ${description}` : null;
        embed.setColour('green');
        break;
      }
      case false: {
        description = description ? `${emotes.xmark} ${description}` : null;
        embed.setColour('red');
        break;
      }
    }

    if (options.emoji) description = description ? `${emotes[options.emoji]} ${description}` : null;
    if (description) embed.setDescription(description);

    return embed;
  };

  message.reply = reply;
  return reply;
};
