const Permission = require('./Permission');

module.exports = class PermissionOverwrite extends Permission {

  constructor(data) {
    super(data.allow, data.deny);
    this.id = data.id;
    this.type = data.type;
  }

};
