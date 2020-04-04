const Permission = require('./Permission');
const PermissionOverwrite = require('./PermissionOverwrite');
const { Permissions } = require('../Constants');

module.exports = class Channel {

  constructor(data, guild) {
    this.id = data._id;
    this.guild = guild;
    this.type = data.type;
    this.shardID = data.shardID;
    this.name = data.name;
    this.position = data.position;
    this.nsfw = data.nsfw;
    this.topic = data.topic;
    this.parentID = data.parentID;
    this.overwrites = new Map();

    data.overwrites.forEach((overwrite) => {
      this.overwrites.set(overwrite.id, new PermissionOverwrite(overwrite));
    });
  }

  async permissionsOf(state, guild, member) {
    let permission = (await member.getPermission(state, guild, member)).allow;
    if(permission & Permissions.administrator) {
      return new Permission(Permissions.all);
    }
    let overwrite = this.overwrites.get(this.guild.id);
    if(overwrite) {
      permission = (permission & ~overwrite.deny) | overwrite.allow;
    }
    let deny = 0;
    let allow = 0;
    for(const roleID of member.roles) {
      if((overwrite = this.overwrites.get(roleID))) {
        deny |= overwrite.deny;
        allow |= overwrite.allow;
      }
    }
    permission = (permission & ~deny) | allow;
    overwrite = this.overwrites.get(member.id);
    if(overwrite) {
      permission = (permission & ~overwrite.deny) | overwrite.allow;
    }
    return new Permission(permission);
  }

};
