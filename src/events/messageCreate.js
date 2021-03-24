module.exports = async (client, message) => {
  const prefixRegex = new RegExp(`^(df!|<@!?${client.user.id}>|${client.config.prefix})( *)?`);
  const match = message.content.match(prefixRegex);
  if (!match) return;
  const prefix = match[0];

  // eslint-disable-next-line require-atomic-updates
  const content = message.content = message.content.substring(prefix.length);
  let command = content.split(' ')[0];
  command = command.toLowerCase().trim();

  const found = client.commands.get(command) || client.commands.find((cmd) => cmd.aliases.indexOf(command) !== -1);
  if (!found) return;

  if (found.category === 'admin' && !client.config.owners.includes(message.author.id)) return;

  await client.commands.execute(message, found);
};
