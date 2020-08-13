// Using some of discord.js code for this ;)

const colours = {
  default: 0x000000,
  white: 0xFFFFFF,
  aqua: 0x1ABC9C,
  green: 0x2ECC71,
  blue: 0x3498DB,
  yellow: 0xFFFF00,
  purple: 0x9B59B6,
  luminousVividPink: 0xE91E63,
  gold: 0xF1C40F,
  orange: 0xE67E22,
  red: 0xE74C3C,
  grey: 0x95A5A6,
  navy: 0x34495E,
  darkAqua: 0x11806A,
  darkGreen: 0x1F8B4C,
  darkBlue: 0x206694,
  darkPurple: 0x71368A,
  darkVividPink: 0xAD1457,
  darkGold: 0xC27C0E,
  darkOrange: 0xA84300,
  darkRed: 0x992D22,
  darkGrey: 0x979C9F,
  darkerGrey: 0x7F8C8D,
  lightGrey: 0xBCC0C0,
  darkNavy: 0x2C3E50,
  blurple: 0x7289DA,
  greyple: 0x99AAB5,
  notBlack: 0x2C2F33,
  notQuiteBlack: 0x23272A
};

function resolveColour(color) {
  if (typeof color === 'string') {
    if (color === 'random') return Math.floor(Math.random() * (0xFFFFFF + 1));
    if (color === 'default') return 0;
    color = colours[color] || parseInt(color.replace('#', ''), 16);
  } else if (Array.isArray(color)) {
    color = (color[0] << 16) + (color[1] << 8) + color[2];
  }

  if (color < 0 || color > 0xFFFFFF) throw new RangeError('COLOR_RANGE');
  else if (color && isNaN(color)) throw new TypeError('COLOR_CONVERT');

  return color;
}

module.exports = colours;
module.exports.resolveColor = resolveColour;
