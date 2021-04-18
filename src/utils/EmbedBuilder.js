const colours = require('./colours');

class EmbedBuilder {

  /**
   * Create an embed builder instance.
   * @param {Message?} message The Discord message
   */
  constructor(message) {
    this.message = message;

    this.fields = [];
  }

  /**
   * Adds a field to the embed (max 25).
   * @param {string} name The name of the field.
   * @param {string} value The value of the field.
   * @param {boolean} [inline=false] Set the field to inline.
   * @returns {EmbedBuilder}
   */
  addField(name, value, inline) {
    this.fields.push({ name, value, inline });
    return this;
  }

  /**
   * Set the author of the embed.
   * @param {string} name The name of the author.
   * @param {string} iconURL The icon of the author.
   * @param {string} [url] The url to link to.
   * @returns {EmbedBuilder}
   */
  setAuthor(name, iconURL, url) {
    this.author = { name, icon_url: iconURL, url };
    return this;
  }

  /**
   * Set the colour of the embed.
   * @param {any} colour Colour to set the embed to.
   * @returns {EmbedBuilder}
   */
  setColour(colour) {
    this.color = colours.resolveColor(colour);
    return this;
  }

  /**
   * Sets the description of the embed.
   * @param {string} description Description of the embed.
   * @returns {EmbedBuilder}
   */
  setDescription(description) {
    this.description = description;
    return this;
  }

  /**
   * Sets the footer of this embed.
   * @param {string} text The text of the footer.
   * @param {string} [iconURL] The icon of the footer.
   * @returns {EmbedBuilder}
   */
  setFooter(text, iconURL) {
    this.footer = { text, iconURL };
    return this;
  }

  /**
   * Sets the image of this embed.
   * @param {string} url The URL of the image.
   * @returns {EmbedBuilder}
   */
  setImage(url) {
    this.image = { url };
    return this;
  }

  /**
   * Sets the thumbnail of this embed.
   * @param {string} url The URL of the thumbnail.
   * @returns {EmbedBuilder}
   */
  setThumbnail(url) {
    this.thumbnail = { url };
    return this;
  }

  /**
   * Sets the timestamp of this embed.
   * @param {Date|number} [timestamp=Date.now()] The timestamp.
   * @returns {EmbedBuilder}
   */
  setTimestamp(timestamp = Date.now()) {
    if (timestamp instanceof Date) timestamp = timestamp.getTime();
    this.timestamp = timestamp;
    return this;
  }

  /**
   * Sets the title of this embed.
   * @param {string} title Title of the embed.
   * @returns {EmbedBuilder}
   */
  setTitle(title) {
    this.title = title;
    return this;
  }

  /**
   * Sets the URL of this embed.
   * @param {string} url The URL.
   * @returns {EmbedBuilder}
   */
  setURL(url) {
    this.url = url;
    return this;
  }

  /**
   * Send the embed to a channel.
   * @returns {null|Promise<Message>}
   */
  send() {
    if (!this.message) return null;

    const embed = { ...this, message: undefined };
    return this.message.channel.createMessage({ embed, messageReferenceID: this.message.id });
  }

}

module.exports = EmbedBuilder;
