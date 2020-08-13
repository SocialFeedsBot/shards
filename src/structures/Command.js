module.exports = class Command {

  constructor(name, category, options = {}) {
    this.name = name;
    this.category = category;

    this.description = options.description || 'None provided.';
    this.args = options.args || [];
    this.aliases = options.aliases || [];
    this.hidden = !!options.hidden;
    this.permissions = options.permissions || [];
    this.botPermissions = options.botPermissions || [];
    this.guildOnly = options.guildOnly || false;

    this.usage = this.args.map((arg) => `${arg.optional ? '[' : '<'}${arg.label || arg.type}${arg.optional ? ']' : '>'}`).join(' ');
  }

  run() {
    throw new Error(`Run function for ${this.name} command not implemented.`);
  }

};
