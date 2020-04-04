const { Permissions } = require('../../rest/Constants');

module.exports = class Permission {

  constructor(allow, deny = 0) {
    this.allow = allow;
    this.deny = deny;
  }

  has(permission) {
    return !!(this.allow & Permissions[permission]);
  }

};
