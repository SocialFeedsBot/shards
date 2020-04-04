const Permission = require('./Permission');
const { Permissions } = require('../../rest/Constants');

const Role = require('./Role');

module.exports = class Member {

  constructor(data) {
    this.user = data.user;
    this.id = data.user.id;
    this.nick = data.nick;
    this.roles = data.roles;
    this.joinedAt = data.joined_at;
  }

  async getPermission(state, guild) {
    if (this.id === guild.ownerID) {
      return new Permission(Permissions.all);
    } else {
      const everyoneRole = new Role(await state.roles.get(guild.id));
      let permissions = everyoneRole.permissions.allow;

      for (const r of this.roles) {
        const role = new Role(await state.roles.get(r));
        if (!role) {
          continue;
        }

        const { allow: perm } = role.permissions;
        if (perm & Permissions.administrator) {
          permissions = Permissions.all;
          break;
        } else {
          permissions |= perm;
        }
      }

      return new Permission(permissions);
    }
  }

};
